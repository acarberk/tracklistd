import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, type Game, type UserGame } from '@prisma/client';

import { type PrismaService } from '../prisma/prisma.service';

import { type GameService } from './game.service';
import { UserGameService } from './user-game.service';

function buildService() {
  const create = jest.fn();
  const findFirst = jest.fn();
  const findMany = jest.fn();
  const update = jest.fn();
  const deleteMany = jest.fn();
  const prisma = {
    userGame: { create, findFirst, findMany, update, deleteMany },
  } as unknown as PrismaService;
  const ensureGameByIgdbId = jest.fn();
  const games = { ensureGameByIgdbId } as unknown as GameService;
  return {
    service: new UserGameService(prisma, games),
    create,
    findFirst,
    findMany,
    update,
    deleteMany,
    ensureGameByIgdbId,
  };
}

const SAMPLE_GAME: Game = {
  id: 'game-uuid-1',
  igdbId: 1942,
  slug: 'witcher-3',
  title: 'The Witcher 3',
  summary: null,
  coverUrl: null,
  releaseDate: null,
  platforms: [],
  genres: [],
  igdbRating: null,
  igdbRatingCount: null,
  steamAppId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSyncedAt: new Date(),
};

function makeUserGame(overrides: Partial<UserGame> = {}): UserGame & { game: Game } {
  const now = new Date();
  return {
    id: 'usergame-uuid-1',
    userId: 'user-1',
    gameId: 'game-uuid-1',
    status: 'WANT_TO_PLAY',
    rating: null,
    review: null,
    startedAt: null,
    completedAt: null,
    hoursPlayed: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
    game: SAMPLE_GAME,
  };
}

describe('UserGameService', () => {
  describe('add', () => {
    it('creates a UserGame with default WANT_TO_PLAY status', async () => {
      const { service, create, ensureGameByIgdbId } = buildService();
      ensureGameByIgdbId.mockResolvedValue(SAMPLE_GAME);
      create.mockResolvedValue(makeUserGame());

      const result = await service.add('user-1', { igdbId: 1942 });

      expect(ensureGameByIgdbId).toHaveBeenCalledWith(1942);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            gameId: SAMPLE_GAME.id,
            status: 'WANT_TO_PLAY',
          }),
        }),
      );
      expect(result.status).toBe('WANT_TO_PLAY');
    });

    it('throws ConflictException on duplicate (P2002)', async () => {
      const { service, create, ensureGameByIgdbId } = buildService();
      ensureGameByIgdbId.mockResolvedValue(SAMPLE_GAME);
      const dupeError = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '7.8.0',
      });
      create.mockRejectedValue(dupeError);

      await expect(service.add('user-1', { igdbId: 1942 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('maps optional fields and converts iso dates', async () => {
      const { service, create, ensureGameByIgdbId } = buildService();
      ensureGameByIgdbId.mockResolvedValue(SAMPLE_GAME);
      create.mockResolvedValue(makeUserGame({ status: 'COMPLETED', rating: 9 }));

      await service.add('user-1', {
        igdbId: 1942,
        status: 'COMPLETED',
        rating: 9,
        review: 'great',
        startedAt: '2025-01-01T00:00:00.000Z',
        completedAt: '2025-03-15T00:00:00.000Z',
        hoursPlayed: 80,
      });

      const data = (create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
      expect(data.status).toBe('COMPLETED');
      expect(data.rating).toBe(9);
      expect(data.review).toBe('great');
      expect(data.startedAt).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(data.completedAt).toEqual(new Date('2025-03-15T00:00:00.000Z'));
      expect(data.hoursPlayed).toBe(80);
    });
  });

  describe('list', () => {
    it('returns items with null nextCursor when there are no more', async () => {
      const { service, findMany } = buildService();
      findMany.mockResolvedValue([makeUserGame(), makeUserGame({ id: 'b' })]);

      const result = await service.list('user-1', { limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
    });

    it('returns nextCursor pointing to the last item when there is more', async () => {
      const { service, findMany } = buildService();
      const five = [
        makeUserGame({ id: 'a' }),
        makeUserGame({ id: 'b' }),
        makeUserGame({ id: 'c' }),
        makeUserGame({ id: 'd' }),
      ];
      findMany.mockResolvedValue(five);

      const result = await service.list('user-1', { limit: 3 });
      expect(result.items).toHaveLength(3);
      expect(result.nextCursor).toBe('c');
    });

    it('applies status filter to the where clause', async () => {
      const { service, findMany } = buildService();
      findMany.mockResolvedValue([]);

      await service.list('user-1', { status: 'PLAYING', limit: 20 });

      const where = (findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> }).where;
      expect(where).toMatchObject({ userId: 'user-1', status: 'PLAYING' });
    });

    it('uses cursor + skip:1 when cursor is provided', async () => {
      const { service, findMany } = buildService();
      findMany.mockResolvedValue([]);

      await service.list('user-1', { cursor: 'usergame-uuid-x', limit: 20 });

      const args = findMany.mock.calls[0]?.[0] as {
        cursor?: { id: string };
        skip?: number;
      };
      expect(args.cursor).toEqual({ id: 'usergame-uuid-x' });
      expect(args.skip).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns entry when found and owned', async () => {
      const { service, findFirst } = buildService();
      findFirst.mockResolvedValue(makeUserGame());

      const entry = await service.findOne('user-1', 'usergame-uuid-1');
      expect(entry.id).toBe('usergame-uuid-1');
    });

    it('throws NotFoundException when entry not found', async () => {
      const { service, findFirst } = buildService();
      findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('pre-checks ownership before updating', async () => {
      const { service, findFirst, update } = buildService();
      findFirst.mockResolvedValue(makeUserGame());
      update.mockResolvedValue(makeUserGame({ status: 'PLAYING' }));

      const result = await service.update('user-1', 'usergame-uuid-1', { status: 'PLAYING' });

      expect(findFirst).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('PLAYING');
    });

    it('passes only defined fields to update data', async () => {
      const { service, findFirst, update } = buildService();
      findFirst.mockResolvedValue(makeUserGame());
      update.mockResolvedValue(makeUserGame({ rating: 8 }));

      await service.update('user-1', 'usergame-uuid-1', { rating: 8 });

      const data = (update.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
      expect(data).toEqual({ rating: 8 });
    });

    it('allows clearing fields with null', async () => {
      const { service, findFirst, update } = buildService();
      findFirst.mockResolvedValue(makeUserGame());
      update.mockResolvedValue(makeUserGame());

      await service.update('user-1', 'usergame-uuid-1', {
        rating: null,
        review: null,
        startedAt: null,
      });

      const data = (update.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
      expect(data.rating).toBeNull();
      expect(data.review).toBeNull();
      expect(data.startedAt).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes the entry when owner matches', async () => {
      const { service, deleteMany } = buildService();
      deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.remove('user-1', 'usergame-uuid-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      const { service, deleteMany } = buildService();
      deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
