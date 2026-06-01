import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  addUserGameInputSchema,
  listUserGamesQuerySchema,
  updateUserGameInputSchema,
  type AddUserGameInput,
  type ListUserGamesQuery,
  type UpdateUserGameInput,
} from '@tracklistd/shared';
import { z } from 'zod';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { type AuthenticatedRequest } from '../auth/types';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';

import {
  AddUserGameDto,
  ListUserGamesResponseDto,
  UpdateUserGameDto,
  UserGameDto,
} from './user-game.dto';
import { type ListUserGamesResult } from './user-game.service';
import { UserGameService } from './user-game.service';

import type { Game, UserGame } from '@prisma/client';

const userGameIdParamSchema = z.object({ id: z.uuid() });
const igdbIdParamSchema = z.object({ igdbId: z.coerce.number().int().positive() });

@ApiTags('user-games')
@ApiBearerAuth()
@Controller('users/me/games')
@UseGuards(JwtAuthGuard)
export class UserGameController {
  constructor(private readonly userGames: UserGameService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a game to the authenticated user library' })
  @ApiBody({ type: AddUserGameDto })
  @ApiCreatedResponse({ type: UserGameDto })
  async add(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(addUserGameInputSchema)) input: AddUserGameInput,
  ): Promise<UserGameDto> {
    const entry = await this.userGames.add(req.user.sub, input);
    return this.toDto(entry);
  }

  @Get()
  @ApiOperation({ summary: 'List the authenticated user library' })
  @ApiOkResponse({ type: ListUserGamesResponseDto })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(listUserGamesQuerySchema)) query: ListUserGamesQuery,
  ): Promise<ListUserGamesResponseDto> {
    const result = await this.userGames.list(req.user.sub, query);
    return this.toListDto(result);
  }

  @Get('by-igdb/:igdbId')
  @ApiOperation({ summary: 'Get the authenticated user library entry for a game by IGDB id' })
  @ApiParam({ name: 'igdbId', type: Number })
  @ApiOkResponse({ type: UserGameDto })
  @ApiNotFoundResponse({ description: 'The game is not in the user library' })
  async findByIgdb(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(igdbIdParamSchema)) params: { igdbId: number },
  ): Promise<UserGameDto> {
    const entry = await this.userGames.findByIgdbId(req.user.sub, params.igdbId);
    if (!entry) {
      throw new NotFoundException({
        code: 'USER_GAME_NOT_FOUND',
        message: 'Library entry not found',
      });
    }
    return this.toDto(entry);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single library entry' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserGameDto })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(userGameIdParamSchema)) params: { id: string },
  ): Promise<UserGameDto> {
    const entry = await this.userGames.findOne(req.user.sub, params.id);
    return this.toDto(entry);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a library entry status, rating, review, or timestamps' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserGameDto })
  @ApiOkResponse({ type: UserGameDto })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(userGameIdParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateUserGameInputSchema)) input: UpdateUserGameInput,
  ): Promise<UserGameDto> {
    const entry = await this.userGames.update(req.user.sub, params.id, input);
    return this.toDto(entry);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a game from the user library' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(userGameIdParamSchema)) params: { id: string },
  ): Promise<void> {
    await this.userGames.remove(req.user.sub, params.id);
  }

  private toListDto(result: ListUserGamesResult): ListUserGamesResponseDto {
    return {
      items: result.items.map((item) => this.toDto(item)),
      nextCursor: result.nextCursor,
    };
  }

  private toDto(entry: UserGame & { game: Game }): UserGameDto {
    return {
      id: entry.id,
      status: entry.status,
      rating: entry.rating,
      review: entry.review,
      startedAt: entry.startedAt?.toISOString() ?? null,
      completedAt: entry.completedAt?.toISOString() ?? null,
      hoursPlayed: entry.hoursPlayed,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      game: {
        id: entry.game.id,
        igdbId: entry.game.igdbId,
        slug: entry.game.slug,
        title: entry.game.title,
        summary: entry.game.summary,
        coverUrl: entry.game.coverUrl,
        releaseDate: entry.game.releaseDate?.toISOString() ?? null,
        platforms: entry.game.platforms,
        genres: entry.game.genres,
      },
    };
  }
}
