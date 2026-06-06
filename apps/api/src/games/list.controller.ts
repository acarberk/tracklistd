import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  addListItemInputSchema,
  createListInputSchema,
  updateListInputSchema,
  type AddListItemInput,
  type CreateListInput,
  type GameListDetail,
  type GameListSummary,
  type UpdateListInput,
} from '@tracklistd/shared';
import { z } from 'zod';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { type AuthenticatedRequest } from '../auth/types';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';

import {
  AddListItemDto,
  CreateListDto,
  GameListDetailDto,
  GameListsResponseDto,
  UpdateListDto,
} from './list.dto';
import { ListService } from './list.service';

const listIdParamSchema = z.object({ id: z.uuid() });
const listItemParamSchema = z.object({ id: z.uuid(), itemId: z.uuid() });

@ApiTags('lists')
@ApiBearerAuth()
@Controller('users/me/lists')
@UseGuards(JwtAuthGuard)
export class ListController {
  constructor(private readonly lists: ListService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a list (max 5 per user)' })
  @ApiBody({ type: CreateListDto })
  @ApiCreatedResponse({ type: GameListDetailDto })
  create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createListInputSchema)) input: CreateListInput,
  ): Promise<GameListDetail> {
    return this.lists.create(req.user.sub, input);
  }

  @Get()
  @ApiOperation({ summary: 'List the authenticated user lists' })
  @ApiOkResponse({ type: GameListsResponseDto })
  async list(@Req() req: AuthenticatedRequest): Promise<{ items: GameListSummary[] }> {
    const items = await this.lists.list(req.user.sub);
    return { items };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a list with its items' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GameListDetailDto })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(listIdParamSchema)) params: { id: string },
  ): Promise<GameListDetail> {
    return this.lists.findOne(req.user.sub, params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a list name, description, or visibility' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateListDto })
  @ApiOkResponse({ type: GameListDetailDto })
  update(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(listIdParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateListInputSchema)) input: UpdateListInput,
  ): Promise<GameListDetail> {
    return this.lists.update(req.user.sub, params.id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a list' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(listIdParamSchema)) params: { id: string },
  ): Promise<void> {
    await this.lists.remove(req.user.sub, params.id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a game to a list by IGDB id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: AddListItemDto })
  @ApiOkResponse({ type: GameListDetailDto })
  addItem(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(listIdParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(addListItemInputSchema)) input: AddListItemInput,
  ): Promise<GameListDetail> {
    return this.lists.addItem(req.user.sub, params.id, input.igdbId);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove a game from a list' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ type: GameListDetailDto })
  removeItem(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(listItemParamSchema)) params: { id: string; itemId: string },
  ): Promise<GameListDetail> {
    return this.lists.removeItem(req.user.sub, params.id, params.itemId);
  }
}
