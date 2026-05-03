import { createHash, randomBytes } from 'crypto';

import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';

import { EnvService } from '../config/env.service';
import { MAILER_TOKEN, type Mailer } from '../mailer/mailer.types';
import { PrismaService } from '../prisma/prisma.service';
import { jitterDelay, parseDurationMs } from '../shared/duration';
import { UserService } from '../user/user.service';

import { PasswordService } from './password.service';

const TOKEN_BYTES = 32;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly passwords: PasswordService,
    private readonly env: EnvService,
    @Inject(MAILER_TOKEN) private readonly mailer: Mailer,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      this.logger.log({ event: 'password_reset_skipped', reason: 'user_not_found' });
      await jitterDelay(150, 250);
      return;
    }

    if (!user.passwordHash) {
      this.logger.log({
        event: 'password_reset_skipped',
        reason: 'oauth_only_account',
        userId: user.id,
      });
      await jitterDelay(150, 250);
      return;
    }

    const rawToken = randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const ttlMs = parseDurationMs(this.env.passwordResetTtl);
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    const resetUrl = this.buildResetUrl(rawToken);
    const html = this.renderHtml(user.displayName, resetUrl);
    const text = this.renderText(user.displayName, resetUrl);

    try {
      await this.mailer.send({
        to: user.email,
        subject: 'Reset your Tracklistd password',
        html,
        text,
      });
    } catch (error) {
      this.logger.error({
        event: 'password_reset_email_failed',
        userId: user.id,
        error,
      });
    }
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    if (rawToken.length < 16) {
      throw new BadRequestException({
        code: 'AUTH_INVALID_RESET_TOKEN',
        message: 'Invalid reset token',
      });
    }

    const tokenHash = this.hashToken(rawToken);
    const passwordHash = await this.passwords.hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      const claim = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (claim.count === 0) {
        const existing = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!existing) {
          throw new BadRequestException({
            code: 'AUTH_INVALID_RESET_TOKEN',
            message: 'Invalid reset token',
          });
        }
        if (existing.usedAt !== null) {
          throw new BadRequestException({
            code: 'AUTH_RESET_TOKEN_USED',
            message: 'Reset link has already been used',
          });
        }
        throw new BadRequestException({
          code: 'AUTH_RESET_TOKEN_EXPIRED',
          message: 'Reset link has expired',
        });
      }

      const claimed = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!claimed) {
        throw new BadRequestException({
          code: 'AUTH_INVALID_RESET_TOKEN',
          message: 'Invalid reset token',
        });
      }

      await tx.user.update({
        where: { id: claimed.userId },
        data: { passwordHash },
      });

      await tx.refreshToken.updateMany({
        where: { userId: claimed.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  private buildResetUrl(token: string): string {
    const base = this.env.appBaseUrl.replace(/\/+$/, '');
    return `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
  }

  private renderHtml(displayName: string, url: string): string {
    const safeName = this.escapeHtml(displayName);
    return [
      '<!doctype html>',
      '<html><body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">',
      `<h2>Reset your password</h2>`,
      `<p>Hi ${safeName},</p>`,
      `<p>Someone requested a password reset for your Tracklistd account. If this was you, click the button below. The link expires in 1 hour.</p>`,
      `<p><a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Reset password</a></p>`,
      `<p>If you did not request a reset, you can safely ignore this email and your password will remain unchanged.</p>`,
      `<p style="color:#777; font-size:12px;">If the button does not work, copy and paste this URL into your browser:<br>${url}</p>`,
      '</body></html>',
    ].join('\n');
  }

  private renderText(displayName: string, url: string): string {
    return [
      `Hi ${displayName},`,
      '',
      'Someone requested a password reset for your Tracklistd account. If this was you, open the link below to set a new password. The link expires in 1 hour.',
      '',
      url,
      '',
      'If you did not request a reset, you can safely ignore this email.',
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
