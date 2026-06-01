import { Body, Controller, Get, NotFoundException, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type User } from '@prisma/client';
import { updateProfileInputSchema, type UpdateProfileInput } from '@tracklistd/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { type AuthenticatedRequest } from '../auth/types';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';

import { UpdateProfileDto, UserProfileDto, UserStatsDto } from './user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user full profile' })
  @ApiOkResponse({ type: UserProfileDto })
  async findMe(@Req() req: AuthenticatedRequest): Promise<UserProfileDto> {
    const user = await this.users.findById(req.user.sub);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    return this.toDto(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: UserProfileDto })
  async updateMe(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateProfileInputSchema)) input: UpdateProfileInput,
  ): Promise<UserProfileDto> {
    const updated = await this.users.updateProfile(req.user.sub, input);
    return this.toDto(updated);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate library stats for the authenticated user' })
  @ApiOkResponse({ type: UserStatsDto })
  getStats(@Req() req: AuthenticatedRequest): Promise<UserStatsDto> {
    return this.users.getStats(req.user.sub);
  }

  private toDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      country: user.country,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
