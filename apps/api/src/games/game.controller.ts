import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { gameSearchInputSchema, type GameSearchInput } from '@tracklistd/shared';
import { z } from 'zod';

import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { IgdbService } from '../igdb/igdb.service';

import { GameDetailDto, GameSearchResponseDto } from './game-search.dto';
import { GameService } from './game.service';

import type { Game } from '@prisma/client';

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(
    private readonly igdb: IgdbService,
    private readonly games: GameService,
  ) {}

  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(gameSearchInputSchema))
  @ApiOperation({ summary: 'Search games by title via IGDB' })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'zelda' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ type: GameSearchResponseDto })
  async search(@Query() query: GameSearchInput): Promise<GameSearchResponseDto> {
    const results = await this.igdb.search(query.q, query.limit);
    return { results };
  }

  @Get('popular')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'List popular games via IGDB (most-rated, main games with covers)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiOkResponse({ type: GameSearchResponseDto })
  async popular(@Query('limit') limit?: string): Promise<GameSearchResponseDto> {
    const parsed = Number(limit);
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 12;
    const results = await this.igdb.popular(safeLimit);
    return { results };
  }

  @Get(':slug')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get a game detail snapshot by slug (cached after first fetch)' })
  @ApiParam({ name: 'slug', example: 'the-legend-of-zelda-breath-of-the-wild' })
  @ApiOkResponse({ type: GameDetailDto })
  async findOne(
    @Param(new ZodValidationPipe(slugParamSchema)) params: { slug: string },
  ): Promise<GameDetailDto> {
    const game = await this.games.findOrFetchBySlug(params.slug);
    return this.toDto(game);
  }

  private toDto(game: Game): GameDetailDto {
    return {
      id: game.id,
      igdbId: game.igdbId,
      slug: game.slug,
      title: game.title,
      summary: game.summary,
      coverUrl: game.coverUrl,
      releaseDate: game.releaseDate?.toISOString() ?? null,
      platforms: game.platforms,
      genres: game.genres,
      igdbRating: game.igdbRating,
      igdbRatingCount: game.igdbRatingCount,
    };
  }
}
