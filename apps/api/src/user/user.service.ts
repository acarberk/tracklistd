import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface SoftDeleteResult {
  userId: string;
  refreshTokensRevoked: number;
}

export interface CreateWithPasswordInput {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
}

export type OAuthProvider = 'google' | 'apple';

export interface CreateFromOAuthInput {
  email: string;
  username: string;
  displayName: string;
  provider: OAuthProvider;
  providerId: string;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
    });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { googleId, deletedAt: null } });
  }

  findByAppleId(appleId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { appleId, deletedAt: null } });
  }

  createWithPassword(input: CreateWithPasswordInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        emailVerified: false,
      },
    });
  }

  createFromOAuth(input: CreateFromOAuthInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        emailVerified: true,
        googleId: input.provider === 'google' ? input.providerId : null,
        appleId: input.provider === 'apple' ? input.providerId : null,
      },
    });
  }

  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  updatePasswordHash(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  linkGoogleId(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId, emailVerified: true },
    });
  }

  async softDelete(userId: string): Promise<SoftDeleteResult> {
    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (claim.count === 0) {
        return { userId, refreshTokensRevoked: 0 };
      }

      const refreshRevoke = await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });

      return { userId, refreshTokensRevoked: refreshRevoke.count };
    });
  }
}
