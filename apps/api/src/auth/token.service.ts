import { createHash, randomUUID } from 'crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';
import { parseDurationMs } from '../shared/duration';

import { JwtService, type RefreshTokenPayload } from './jwt.service';

interface IssueRefreshOptions {
  userId: string;
  family?: string;
  rotation?: number;
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedRefresh {
  jti: string;
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

    const ttlMs = parseDurationMs(this.env.jwtRefreshTtl);
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

    return { jti, rawToken, expiresAt, family, rotation };
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

    const result = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (claim.count === 0) {
        const existing = await tx.refreshToken.findUnique({ where: { tokenHash } });

        if (!existing) {
          this.logger.warn({ event: 'refresh_unknown', family: payload.family });
          await tx.refreshToken.updateMany({
            where: { family: payload.family, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          throw new UnauthorizedException('Refresh token reuse detected');
        }

        if (existing.revokedAt !== null) {
          this.logger.warn({ event: 'refresh_replay', family: existing.family });
          await tx.refreshToken.updateMany({
            where: { family: existing.family, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          throw new UnauthorizedException('Refresh token reuse detected');
        }

        throw new UnauthorizedException('Refresh token expired');
      }

      const previous = await tx.refreshToken.findUnique({ where: { tokenHash } });
      if (!previous) {
        throw new UnauthorizedException('Refresh token disappeared mid-rotation');
      }

      const reissued = await this.issueRefreshTokenInTx(tx, {
        userId: previous.userId,
        family: previous.family,
        rotation: previous.rotation + 1,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
      });

      await tx.refreshToken.update({
        where: { id: previous.id },
        data: { replacedBy: reissued.jti },
      });

      return { userId: previous.userId, reissued };
    });

    return result;
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueRefreshTokenInTx(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    options: IssueRefreshOptions,
  ): Promise<IssuedRefresh> {
    const family = options.family ?? randomUUID();
    const rotation = options.rotation ?? 0;
    const jti = randomUUID();

    const rawToken = await this.jwt.signRefreshToken({
      sub: options.userId,
      jti,
      family,
      rotation,
    });

    const ttlMs = parseDurationMs(this.env.jwtRefreshTtl);
    const expiresAt = new Date(Date.now() + ttlMs);

    await tx.refreshToken.create({
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

    return { jti, rawToken, expiresAt, family, rotation };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
