import { createHash, randomBytes } from 'crypto';

import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';

import { EnvService } from '../config/env.service';
import { MAILER_TOKEN, type Mailer } from '../mailer/mailer.types';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

const MS_BY_UNIT: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const TOKEN_BYTES = 32;

export interface IssuedVerificationToken {
  rawToken: string;
  expiresAt: Date;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly env: EnvService,
    @Inject(MAILER_TOKEN) private readonly mailer: Mailer,
  ) {}

  async issueAndSend(userId: string, email: string, displayName: string): Promise<void> {
    const issued = await this.issueToken(userId);
    await this.mailer.send({
      to: email,
      subject: 'Verify your Tracklistd email',
      html: this.renderHtml(displayName, issued.rawToken),
      text: this.renderText(displayName, issued.rawToken),
    });
  }

  async verifyByToken(rawToken: string): Promise<{ userId: string }> {
    if (rawToken.length < 16) {
      throw new BadRequestException({
        code: 'AUTH_INVALID_VERIFICATION_TOKEN',
        message: 'Invalid verification token',
      });
    }

    const tokenHash = this.hashToken(rawToken);

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.emailVerificationToken.updateMany({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (claim.count === 0) {
        const existing = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
        if (!existing) {
          throw new BadRequestException({
            code: 'AUTH_INVALID_VERIFICATION_TOKEN',
            message: 'Invalid verification token',
          });
        }
        if (existing.usedAt !== null) {
          throw new BadRequestException({
            code: 'AUTH_VERIFICATION_TOKEN_USED',
            message: 'Verification link has already been used',
          });
        }
        throw new BadRequestException({
          code: 'AUTH_VERIFICATION_TOKEN_EXPIRED',
          message: 'Verification link has expired',
        });
      }

      const claimed = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
      if (!claimed) {
        throw new BadRequestException({
          code: 'AUTH_INVALID_VERIFICATION_TOKEN',
          message: 'Invalid verification token',
        });
      }

      const user = await tx.user.update({
        where: { id: claimed.userId },
        data: { emailVerified: true },
      });

      return { userId: user.id };
    });
  }

  async resendForEmail(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerified) {
      this.logger.log({
        event: 'verification_resend_skipped',
        reason: !user ? 'user_not_found' : 'already_verified',
      });
      await this.padNoOpDelay();
      return;
    }
    await this.issueAndSend(user.id, user.email, user.displayName);
  }

  private padNoOpDelay(): Promise<void> {
    const jitterMs = 150 + Math.floor(Math.random() * 250);
    return new Promise((resolve) => {
      setTimeout(resolve, jitterMs);
    });
  }

  private async issueToken(userId: string): Promise<IssuedVerificationToken> {
    const rawToken = randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const ttlMs = this.parseDurationMs(this.env.emailVerificationTtl);
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.create({
        data: { userId, tokenHash, expiresAt },
      }),
    ]);

    return { rawToken, expiresAt };
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private parseDurationMs(value: string): number {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
    if (match?.[1] === undefined || match[2] === undefined) {
      throw new Error(`Invalid duration: ${value}`);
    }
    const amount = Number.parseInt(match[1], 10);
    const unit = match[2];
    const multiplier = MS_BY_UNIT[unit];
    if (multiplier === undefined) {
      throw new Error(`Unknown duration unit: ${unit}`);
    }
    return amount * multiplier;
  }

  private buildVerificationUrl(token: string): string {
    const base = this.env.appBaseUrl.replace(/\/+$/, '');
    return `${base}/auth/verify-email?token=${encodeURIComponent(token)}`;
  }

  private renderHtml(displayName: string, token: string): string {
    const url = this.buildVerificationUrl(token);
    return [
      '<div style="font-family: -apple-system, sans-serif; max-width: 480px; padding: 24px;">',
      `<h2 style="margin: 0 0 16px;">Welcome to Tracklistd, ${this.escapeHtml(displayName)}.</h2>`,
      '<p>Please verify your email address by clicking the button below.</p>',
      `<p><a href="${url}" style="display: inline-block; padding: 12px 20px; background: #111; color: #fff; border-radius: 6px; text-decoration: none;">Verify email</a></p>`,
      '<p style="color: #666; font-size: 13px;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>',
      '</div>',
    ].join('');
  }

  private renderText(displayName: string, token: string): string {
    const url = this.buildVerificationUrl(token);
    return [
      `Welcome to Tracklistd, ${displayName}.`,
      '',
      `Verify your email by opening this link:`,
      url,
      '',
      'This link expires in 24 hours. If you did not create an account, you can ignore this email.',
    ].join('\n');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
