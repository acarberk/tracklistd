import { NotFoundException } from '@nestjs/common';
import { Prisma, type Game } from '@prisma/client';

import { type IgdbGame, type IgdbService } from '../igdb/igdb.service';
import { type PrismaService } from '../prisma/prisma.service';

import { GameService } from './game.service';

function buildService() {
  const findUnique = jest.fn();
  const create = jest.fn();
  const prisma = { game: { findUnique, create } } as unknown as PrismaService;
  const findByIgdbId = jest.fn();
  const igdb = { findByIgdbId } as unknown as IgdbService;
  return { service: new GameService(prisma, igdb), findUnique, create, findByIgdbId };
}

const SAMPLE_IGDB: IgdbGame = {
  igdbId: 1942,
  slug: 'the-witcher-3-wild-hunt',
  title: 'The Witcher 3: Wild Hunt',
  summary: 'Open world RPG',
  coverUrl: 'https://images.igdb.com/foo.jpg',
  releaseDate: '2015-05-19T00:00:00.000Z',
  platforms: ['PC', 'PS4', 'Xbox One'],
  genres: ['Role-playing (RPG)'],
  igdbRating: 92.5,
  igdbRatingCount: 4500,
};

const SAMPLE_DB_GAME: Game = {
  id: 'game-uuid-1',
  igdbId: 1942,
  slug: 'the-witcher-3-wild-hunt',
  title: 'The Witcher 3: Wild Hunt',
  summary: 'Open world RPG',
  coverUrl: 'https://images.igdb.com/foo.jpg',
  releaseDate: new Date('2015-05-19T00:00:00.000Z'),
  platforms: ['PC', 'PS4', 'Xbox One'],
  genres: ['Role-playing (RPG)'],
  igdbRating: 92.5,
  igdbRatingCount: 4500,
  steamAppId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSyncedAt: new Date(),
};

describe('GameService', () => {
  describe('ensureGameByIgdbId', () => {
    it('returns existing snapshot without hitting IGDB', async () => {
      const { service, findUnique, findByIgdbId, create } = buildService();
      findUnique.mockResolvedValue(SAMPLE_DB_GAME);

      const result = await service.ensureGameByIgdbId(1942);

      expect(result).toBe(SAMPLE_DB_GAME);
      expect(findByIgdbId).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });

    it('fetches from IGDB and creates row when not in DB', async () => {
      const { service, findUnique, findByIgdbId, create } = buildService();
      findUnique.mockResolvedValueOnce(null);
      findByIgdbId.mockResolvedValue(SAMPLE_IGDB);
      create.mockResolvedValue(SAMPLE_DB_GAME);

      const result = await service.ensureGameByIgdbId(1942);

      expect(findByIgdbId).toHaveBeenCalledWith(1942);
      expect(create).toHaveBeenCalledTimes(1);
      expect(result).toBe(SAMPLE_DB_GAME);
    });

    it('throws NotFoundException when IGDB returns null', async () => {
      const { service, findUnique, findByIgdbId, create } = buildService();
      findUnique.mockResolvedValueOnce(null);
      findByIgdbId.mockResolvedValue(null);

      await expect(service.ensureGameByIgdbId(999_999)).rejects.toBeInstanceOf(NotFoundException);
      expect(create).not.toHaveBeenCalled();
    });

    it('retries lookup on P2002 race and returns the row created by the other writer', async () => {
      const { service, findUnique, findByIgdbId, create } = buildService();
      findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(SAMPLE_DB_GAME);
      findByIgdbId.mockResolvedValue(SAMPLE_IGDB);
      const raceError = new Prisma.PrismaClientKnownRequestError('race', {
        code: 'P2002',
        clientVersion: '7.8.0',
      });
      create.mockRejectedValue(raceError);

      const result = await service.ensureGameByIgdbId(1942);
      expect(result).toBe(SAMPLE_DB_GAME);
    });

    it('rethrows non-P2002 errors', async () => {
      const { service, findUnique, findByIgdbId, create } = buildService();
      findUnique.mockResolvedValue(null);
      findByIgdbId.mockResolvedValue(SAMPLE_IGDB);
      create.mockRejectedValue(new Error('disk full'));

      await expect(service.ensureGameByIgdbId(1942)).rejects.toThrow(/disk full/);
    });
  });
});
