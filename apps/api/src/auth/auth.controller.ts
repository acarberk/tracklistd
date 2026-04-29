import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  loginInputSchema,
  registerInputSchema,
  type LoginInput,
  type RegisterInput,
} from '@tracklistd/shared';

import { EnvService } from '../config/env.service';

import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  PublicUserDto,
  RefreshResponseDto,
  RegisterDto,
  RegisterResponseDto,
} from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { type AuthenticatedRequest } from './types';
import { ZodValidationPipe } from './zod-validation.pipe';

import type { FastifyReply, FastifyRequest } from 'fastify';

const REFRESH_COOKIE = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly env: EnvService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerInputSchema))
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  register(@Body() body: RegisterInput): Promise<RegisterResponseDto> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginInputSchema))
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() body: LoginInput,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<LoginResponseDto> {
    const session = await this.auth.login(body, this.requestContext(req));
    this.setRefreshCookie(res, session.tokens.refreshToken, session.tokens.refreshExpiresAt);
    return { accessToken: session.tokens.accessToken, user: session.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token and return a new access token' })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh cookie missing, expired, or reused' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<RefreshResponseDto> {
    const cookie = this.readRefreshCookie(req);
    if (!cookie) {
      throw new UnauthorizedException('Missing refresh cookie');
    }
    const tokens = await this.auth.refresh(cookie, this.requestContext(req));
    this.setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token and clear the cookie' })
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<void> {
    const cookie = this.readRefreshCookie(req);
    if (cookie) {
      await this.auth.logout(cookie);
    }
    this.clearRefreshCookie(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  me(@Req() req: AuthenticatedRequest): Promise<PublicUserDto> {
    return this.auth.me(req.user.sub);
  }

  private requestContext(req: FastifyRequest): { userAgent?: string; ipAddress?: string } {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  private readRefreshCookie(req: FastifyRequest): string | undefined {
    const header = req.headers.cookie;
    if (!header) {
      return undefined;
    }
    const match = header.split(';').find((part) => part.trim().startsWith(`${REFRESH_COOKIE}=`));
    if (!match) {
      return undefined;
    }
    return decodeURIComponent(match.split('=').slice(1).join('=').trim());
  }

  private setRefreshCookie(res: FastifyReply, value: string, expiresAt: Date): void {
    const isSecure = this.env.isProduction;
    const cookie = [
      `${REFRESH_COOKIE}=${encodeURIComponent(value)}`,
      `Expires=${expiresAt.toUTCString()}`,
      'HttpOnly',
      'Path=/api/auth',
      'SameSite=Lax',
      isSecure ? 'Secure' : null,
      this.env.cookieDomain ? `Domain=${this.env.cookieDomain}` : null,
    ]
      .filter(Boolean)
      .join('; ');
    void res.header('Set-Cookie', cookie);
  }

  private clearRefreshCookie(res: FastifyReply): void {
    const cookie = [
      `${REFRESH_COOKIE}=`,
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'HttpOnly',
      'Path=/api/auth',
      'SameSite=Lax',
      this.env.isProduction ? 'Secure' : null,
      this.env.cookieDomain ? `Domain=${this.env.cookieDomain}` : null,
    ]
      .filter(Boolean)
      .join('; ');
    void res.header('Set-Cookie', cookie);
  }
}
