import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';
import {
  GAME_STATUSES,
  type GameStatus,
  type PublicProfileOutput,
  type PublicUserGame,
  type UserStatsOutput,
} from '@tracklistd/shared';

import { PrismaService } from '../prisma/prisma.service';

const TOP_BUCKET_LIMIT = 8;

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

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const data: Record<string, unknown> = {};
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.country !== undefined) data.country = input.country;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

    if (Object.keys(data).length === 0) {
      const existing = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });
      if (!existing) {
        throw new Error(`User ${userId} not found`);
      }
      return existing;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
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

  async getPublicProfile(username: string): Promise<PublicProfileOutput | null> {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    const grouped = await this.prisma.userGame.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true },
    });

    const byStatus = Object.fromEntries(GAME_STATUSES.map((status) => [status, 0])) as Record<
      GameStatus,
      number
    >;
    let total = 0;
    for (const row of grouped) {
      byStatus[row.status] = row._count.status;
      total += row._count.status;
    }

    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      country: user.country,
      createdAt: user.createdAt.toISOString(),
      stats: { total, byStatus },
    };
  }

  async getPublicGames(username: string, limit: number): Promise<PublicUserGame[] | null> {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    const entries = await this.prisma.userGame.findMany({
      where: { userId: user.id },
      include: { game: true },
      orderBy: [{ rating: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: limit,
    });

    return entries.map((entry) => ({
      slug: entry.game.slug,
      title: entry.game.title,
      coverUrl: entry.game.coverUrl,
      releaseDate: entry.game.releaseDate?.toISOString() ?? null,
      platforms: entry.game.platforms,
      status: entry.status,
      rating: entry.rating,
    }));
  }

  async getStats(userId: string): Promise<UserStatsOutput> {
    const entries = await this.prisma.userGame.findMany({
      where: { userId },
      select: {
        status: true,
        rating: true,
        hoursPlayed: true,
        game: { select: { genres: true, platforms: true } },
      },
    });

    const byStatus = Object.fromEntries(GAME_STATUSES.map((status) => [status, 0])) as Record<
      GameStatus,
      number
    >;
    const genreCounts = new Map<string, number>();
    const platformCounts = new Map<string, number>();
    let totalHours = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const entry of entries) {
      byStatus[entry.status] += 1;
      totalHours += entry.hoursPlayed ?? 0;
      if (entry.rating !== null) {
        ratingSum += entry.rating;
        ratingCount += 1;
      }
      for (const genre of entry.game.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
      for (const platform of entry.game.platforms) {
        platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
      }
    }

    const topBuckets = (counts: Map<string, number>): { name: string; count: number }[] =>
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_BUCKET_LIMIT)
        .map(([name, count]) => ({ name, count }));

    return {
      totalGames: entries.length,
      totalHours,
      averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
      byStatus,
      topGenres: topBuckets(genreCounts),
      topPlatforms: topBuckets(platformCounts),
    };
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

  linkGoogleId(
    userId: string,
    googleId: string,
    options: { markEmailVerified: boolean; clearPassword: boolean },
  ): Promise<User> {
    const data: { googleId: string; emailVerified?: true; passwordHash?: null } = { googleId };
    if (options.markEmailVerified) {
      data.emailVerified = true;
    }
    if (options.clearPassword) {
      data.passwordHash = null;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
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
