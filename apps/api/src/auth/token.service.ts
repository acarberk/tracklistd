import { createHash, randomUUID } from 'crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { type RefreshToken } from '@prisma/client';

import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';

import { JwtService, type RefreshTokenPayload } from './jwt.service';

const MS_BY_UNIT: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

interface IssueRefreshOptions {
  userId: string;
  family?: string;
  rotation?: number;
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedRefresh {
  rawToken: string;
  expiresAt: Date;
  family: string;
  rotation: number;
}

export interface ConsumeRefreshResult {
  userId: string;
  reissued: IssuedRefresh;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  async issueRefreshToken(options: IssueRefreshOptions): Promise<IssuedRefresh> {
    const family = options.family ?? randomUUID();
    const rotation = options.rotation ?? 0;
    const jti = randomUUID();

    const rawToken = await this.jwt.signRefreshToken({
      sub: options.userId,
      jti,
      family,
      rotation,
    });

    const ttlMs = this.parseDurationMs(this.env.jwtRefreshTtl);
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: options.userId,
        tokenHash: this.hashToken(rawToken),
        family,
        rotation,
        expiresAt,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
      },
    });

    return { rawToken, expiresAt, family, rotation };
  }

  async consumeRefreshToken(
    rawToken: string,
    options: { userAgent?: string; ipAddress?: string },
  ): Promise<ConsumeRefreshResult> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyRefreshToken(rawToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      this.logger.warn(
        `Refresh token not found in store; possible theft for family=${payload.family}`,
      );
      await this.revokeFamily(payload.family);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.revokedAt !== null) {
      this.logger.warn(
        `Revoked refresh token reuse for family=${payload.family}; revoking entire family`,
      );
      await this.revokeFamily(stored.family);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const reissued = await this.rotate(stored, options);
    return { userId: stored.userId, reissued };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (stored?.revokedAt === null) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async rotate(
    previous: RefreshToken,
    options: { userAgent?: string; ipAddress?: string },
  ): Promise<IssuedRefresh> {
    const next = await this.issueRefreshToken({
      userId: previous.userId,
      family: previous.family,
      rotation: previous.rotation + 1,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
    });

    await this.prisma.refreshToken.update({
      where: { id: previous.id },
      data: { revokedAt: new Date(), replacedBy: this.extractJtiFromHash(next.rawToken) },
    });

    return next;
  }

  private async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
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

  private extractJtiFromHash(rawToken: string): string {
    const segments = rawToken.split('.');
    if (segments.length !== 3 || segments[1] === undefined) {
      return '';
    }
    try {
      const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString()) as {
        jti?: string;
      };
      return payload.jti ?? '';
    } catch {
      return '';
    }
  }
}
