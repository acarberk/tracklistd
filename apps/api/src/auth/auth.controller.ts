import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  loginInputSchema,
  registerInputSchema,
  resendVerificationInputSchema,
  type LoginInput,
  type RegisterInput,
  type ResendVerificationInput,
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
import { ResendVerificationDto, VerifyEmailResponseDto } from './email-verification.dto';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { type AuthenticatedRequest } from './types';
import { ZodValidationPipe } from './zod-validation.pipe';

import type { FastifyReply, FastifyRequest } from 'fastify';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly env: EnvService,
    private readonly emailVerification: EmailVerificationService,
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
    const cookie = req.cookies[REFRESH_COOKIE];
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
    const cookie = req.cookies[REFRESH_COOKIE];
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

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify the email address using the token from the link' })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiOkResponse({ type: VerifyEmailResponseDto })
  async verifyEmail(@Query('token') token: string): Promise<VerifyEmailResponseDto> {
    if (!token) {
      throw new BadRequestException({
        code: 'AUTH_INVALID_VERIFICATION_TOKEN',
        message: 'Token is required',
      });
    }
    await this.emailVerification.verifyByToken(token);
    return { verified: true };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(resendVerificationInputSchema))
  @ApiOperation({
    summary: 'Resend the verification email if the address belongs to an unverified user',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiNoContentResponse({ description: 'Always returns 204 to prevent enumeration' })
  async resendVerification(@Body() body: ResendVerificationInput): Promise<void> {
    await this.emailVerification.resendForEmail(body.email);
  }

  private requestContext(req: FastifyRequest): { userAgent?: string; ipAddress?: string } {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  private setRefreshCookie(res: FastifyReply, value: string, expiresAt: Date): void {
    void res.header('Set-Cookie', this.serializeCookie(value, expiresAt));
  }

  private clearRefreshCookie(res: FastifyReply): void {
    void res.header('Set-Cookie', this.serializeCookie('', new Date(0), { clearing: true }));
  }

  private serializeCookie(
    value: string,
    expiresAt: Date,
    options: { clearing?: boolean } = {},
  ): string {
    const parts: string[] = [
      `${REFRESH_COOKIE}=${options.clearing ? '' : encodeURIComponent(value)}`,
      `Expires=${expiresAt.toUTCString()}`,
      'HttpOnly',
      `Path=${REFRESH_COOKIE_PATH}`,
      'SameSite=Lax',
    ];
    if (this.env.isProduction) {
      parts.push('Secure');
    }
    if (this.env.cookieDomain) {
      parts.push(`Domain=${this.env.cookieDomain}`);
    }
    return parts.join('; ');
  }
}
