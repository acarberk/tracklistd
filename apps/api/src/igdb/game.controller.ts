import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { gameSearchInputSchema, type GameSearchInput } from '@tracklistd/shared';

import { ZodValidationPipe } from '../auth/zod-validation.pipe';

import { GameSearchResponseDto } from './game-search.dto';
import { IgdbService } from './igdb.service';

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private readonly igdb: IgdbService) {}

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
}
