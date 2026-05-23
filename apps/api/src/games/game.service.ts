import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, type Game } from '@prisma/client';

import { type IgdbGame, IgdbService } from '../igdb/igdb.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly igdb: IgdbService,
  ) {}

  findById(id: string): Promise<Game | null> {
    return this.prisma.game.findUnique({ where: { id } });
  }

  async findOrFetchBySlug(slug: string): Promise<Game> {
    const existing = await this.prisma.game.findUnique({ where: { slug } });
    if (existing) {
      return existing;
    }

    const fetched = await this.igdb.findBySlug(slug);
    if (!fetched) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: `Game with slug "${slug}" not found`,
      });
    }

    return this.persistSnapshot(fetched);
  }

  async ensureGameByIgdbId(igdbId: number): Promise<Game> {
    const existing = await this.prisma.game.findUnique({ where: { igdbId } });
    if (existing) {
      return existing;
    }

    const fetched = await this.igdb.findByIgdbId(igdbId);
    if (!fetched) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: `IGDB game ${String(igdbId)} not found`,
      });
    }

    return this.persistSnapshot(fetched);
  }

  private async persistSnapshot(fetched: IgdbGame): Promise<Game> {
    try {
      return await this.prisma.game.create({
        data: {
          igdbId: fetched.igdbId,
          slug: fetched.slug,
          title: fetched.title,
          summary: fetched.summary ?? null,
          coverUrl: fetched.coverUrl ?? null,
          releaseDate: fetched.releaseDate ? new Date(fetched.releaseDate) : null,
          platforms: fetched.platforms,
          genres: fetched.genres,
          igdbRating: fetched.igdbRating ?? null,
          igdbRatingCount: fetched.igdbRatingCount ?? null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const racedRow = await this.prisma.game.findUnique({ where: { igdbId: fetched.igdbId } });
        if (racedRow) {
          return racedRow;
        }
      }
      this.logger.error({
        event: 'game_snapshot_create_failed',
        igdbId: fetched.igdbId,
        error,
      });
      throw error;
    }
  }
}
