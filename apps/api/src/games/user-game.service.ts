import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GameStatus, Prisma, type Game, type UserGame } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { GameService } from './game.service';

export interface AddUserGameDto {
  igdbId: number;
  status?: GameStatus;
  rating?: number;
  review?: string;
  startedAt?: string;
  completedAt?: string;
  hoursPlayed?: number;
}

export interface UpdateUserGameDto {
  status?: GameStatus;
  rating?: number | null;
  review?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  hoursPlayed?: number | null;
}

export interface ListUserGamesDto {
  status?: GameStatus;
  cursor?: string;
  limit: number;
}

export interface ListUserGamesResult {
  items: (UserGame & { game: Game })[];
  nextCursor: string | null;
}

@Injectable()
export class UserGameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly games: GameService,
  ) {}

  async add(userId: string, input: AddUserGameDto): Promise<UserGame & { game: Game }> {
    const game = await this.games.ensureGameByIgdbId(input.igdbId);

    try {
      return await this.prisma.userGame.create({
        data: {
          userId,
          gameId: game.id,
          status: input.status ?? 'WANT_TO_PLAY',
          rating: input.rating ?? null,
          review: input.review ?? null,
          startedAt: input.startedAt ? new Date(input.startedAt) : null,
          completedAt: input.completedAt ? new Date(input.completedAt) : null,
          hoursPlayed: input.hoursPlayed ?? null,
        },
        include: { game: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'USER_GAME_ALREADY_EXISTS',
          message: 'This game is already in your library',
        });
      }
      throw error;
    }
  }

  async list(userId: string, input: ListUserGamesDto): Promise<ListUserGamesResult> {
    const where: Prisma.UserGameWhereInput = { userId };
    if (input.status) {
      where.status = input.status;
    }

    const items = await this.prisma.userGame.findMany({
      where,
      include: { game: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > input.limit;
    const trimmed = hasMore ? items.slice(0, input.limit) : items;
    const last = trimmed[trimmed.length - 1];
    const nextCursor = hasMore && last ? last.id : null;

    return { items: trimmed, nextCursor };
  }

  async findOne(userId: string, userGameId: string): Promise<UserGame & { game: Game }> {
    const entry = await this.prisma.userGame.findFirst({
      where: { id: userGameId, userId },
      include: { game: true },
    });
    if (!entry) {
      throw new NotFoundException({
        code: 'USER_GAME_NOT_FOUND',
        message: 'Library entry not found',
      });
    }
    return entry;
  }

  async update(
    userId: string,
    userGameId: string,
    input: UpdateUserGameDto,
  ): Promise<UserGame & { game: Game }> {
    await this.findOne(userId, userGameId);

    const data: Prisma.UserGameUpdateInput = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.review !== undefined) data.review = input.review;
    if (input.hoursPlayed !== undefined) data.hoursPlayed = input.hoursPlayed;
    if (input.startedAt !== undefined) {
      data.startedAt = input.startedAt === null ? null : new Date(input.startedAt);
    }
    if (input.completedAt !== undefined) {
      data.completedAt = input.completedAt === null ? null : new Date(input.completedAt);
    }

    return this.prisma.userGame.update({
      where: { id: userGameId },
      data,
      include: { game: true },
    });
  }

  async remove(userId: string, userGameId: string): Promise<void> {
    const deleted = await this.prisma.userGame.deleteMany({
      where: { id: userGameId, userId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException({
        code: 'USER_GAME_NOT_FOUND',
        message: 'Library entry not found',
      });
    }
  }
}
