import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicProfileDto } from './user.dto';
import { UserService } from './user.service';

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
}
