import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MAX_LISTS_PER_USER, type GameListDetail, type GameListSummary } from '@tracklistd/shared';

import { PrismaService } from '../prisma/prisma.service';

import { GameService } from './game.service';

export interface CreateListDto {
  name: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface UpdateListDto {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
}

@Injectable()
export class ListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly games: GameService,
  ) {}

  async create(userId: string, input: CreateListDto): Promise<GameListDetail> {
    const count = await this.prisma.gameList.count({ where: { userId } });
    if (count >= MAX_LISTS_PER_USER) {
      throw new ConflictException({
        code: 'LIST_LIMIT_REACHED',
        message: `You can create at most ${String(MAX_LISTS_PER_USER)} lists`,
      });
    }

    const list = await this.prisma.gameList.create({
      data: {
        userId,
        name: input.name,
        description: input.description ?? null,
        isPublic: input.isPublic ?? true,
      },
    });

    return this.findOne(userId, list.id);
  }

  async list(userId: string): Promise<GameListSummary[]> {
    const lists = await this.prisma.gameList.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      isPublic: list.isPublic,
      itemCount: list._count.items,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    }));
  }

  async findOne(userId: string, listId: string): Promise<GameListDetail> {
    const list = await this.prisma.gameList.findFirst({
      where: { id: listId, userId },
      include: {
        items: { include: { game: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!list) {
      throw new NotFoundException({ code: 'LIST_NOT_FOUND', message: 'List not found' });
    }

    return {
      id: list.id,
      name: list.name,
      description: list.description,
      isPublic: list.isPublic,
      itemCount: list.items.length,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      items: list.items.map((item) => ({
        id: item.id,
        position: item.position,
        game: {
          slug: item.game.slug,
          title: item.game.title,
          coverUrl: item.game.coverUrl,
          releaseDate: item.game.releaseDate?.toISOString() ?? null,
          platforms: item.game.platforms,
        },
      })),
    };
  }

  async update(userId: string, listId: string, input: UpdateListDto): Promise<GameListDetail> {
    await this.assertOwned(userId, listId);

    const data: Prisma.GameListUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.isPublic !== undefined) data.isPublic = input.isPublic;

    await this.prisma.gameList.update({ where: { id: listId }, data });
    return this.findOne(userId, listId);
  }

  async remove(userId: string, listId: string): Promise<void> {
    const deleted = await this.prisma.gameList.deleteMany({ where: { id: listId, userId } });
    if (deleted.count === 0) {
      throw new NotFoundException({ code: 'LIST_NOT_FOUND', message: 'List not found' });
    }
  }

  async addItem(userId: string, listId: string, igdbId: number): Promise<GameListDetail> {
    await this.assertOwned(userId, listId);
    const game = await this.games.ensureGameByIgdbId(igdbId);

    const last = await this.prisma.gameListItem.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
    });
    const position = (last?.position ?? -1) + 1;

    try {
      await this.prisma.gameListItem.create({ data: { listId, gameId: game.id, position } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'LIST_ITEM_EXISTS',
          message: 'This game is already in the list',
        });
      }
      throw error;
    }

    return this.findOne(userId, listId);
  }

  async removeItem(userId: string, listId: string, itemId: string): Promise<GameListDetail> {
    const deleted = await this.prisma.gameListItem.deleteMany({
      where: { id: itemId, listId, list: { userId } },
    });
    if (deleted.count === 0) {
      throw new NotFoundException({ code: 'LIST_ITEM_NOT_FOUND', message: 'List item not found' });
    }
    return this.findOne(userId, listId);
  }

  private async assertOwned(userId: string, listId: string): Promise<void> {
    const list = await this.prisma.gameList.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });
    if (!list) {
      throw new NotFoundException({ code: 'LIST_NOT_FOUND', message: 'List not found' });
    }
  }
}
