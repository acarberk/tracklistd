import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { PublicProfileDto, PublicUserGamesDto } from './user.dto';
import { UserService } from './user.service';

const DEFAULT_GAMES_LIMIT = 12;
const MAX_GAMES_LIMIT = 50;

@ApiTags('users')
@Controller('users')
export class PublicUserController {
  constructor(private readonly users: UserService) {}

  @Get(':username')
  @ApiOperation({ summary: 'Get a public user profile by username' })
  @ApiOkResponse({ type: PublicProfileDto })
  @ApiNotFoundResponse({ description: 'No user with this username' })
  async getPublicProfile(@Param('username') username: string): Promise<PublicProfileDto> {
    const profile = await this.users.getPublicProfile(username);
    if (!profile) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return profile;
  }

  @Get(':username/games')
  @ApiOperation({ summary: 'List a user top games (highest-rated first) for the public profile' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiOkResponse({ type: PublicUserGamesDto })
  @ApiNotFoundResponse({ description: 'No user with this username' })
  async getPublicGames(
    @Param('username') username: string,
    @Query('limit') limit?: string,
  ): Promise<PublicUserGamesDto> {
    const parsed = Number(limit);
    const safeLimit =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(parsed, MAX_GAMES_LIMIT)
        : DEFAULT_GAMES_LIMIT;
    const items = await this.users.getPublicGames(username, safeLimit);
    if (items === null) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return { items };
  }
}
