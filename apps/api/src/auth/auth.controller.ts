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
import { Throttle } from '@nestjs/throttler';
import {
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resendVerificationInputSchema,
  resetPasswordInputSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResendVerificationInput,
  type ResetPasswordInput,
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
import { GoogleCallbackGuard, GoogleStartGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto, ResetPasswordDto } from './password-reset.dto';
import { PasswordResetService } from './password-reset.service';
import { type AuthenticatedRequest } from './types';
import { ZodValidationPipe } from './zod-validation.pipe';

import type { User } from '@prisma/client';
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
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @UsePipes(new ZodValidationPipe(registerInputSchema))
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  register(@Body() body: RegisterInput): Promise<RegisterResponseDto> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
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
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
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
  async verifyEmail(@Query('token') token: unknown): Promise<VerifyEmailResponseDto> {
    if (typeof token !== 'string' || token.length === 0) {
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
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @UsePipes(new ZodValidationPipe(resendVerificationInputSchema))
  @ApiOperation({
    summary: 'Resend the verification email if the address belongs to an unverified user',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiNoContentResponse({ description: 'Always returns 204 to prevent enumeration' })
  async resendVerification(@Body() body: ResendVerificationInput): Promise<void> {
    await this.emailVerification.resendForEmail(body.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @UsePipes(new ZodValidationPipe(forgotPasswordInputSchema))
  @ApiOperation({ summary: 'Send a password reset email if the address belongs to a user' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiNoContentResponse({ description: 'Always returns 204 to prevent enumeration' })
  async forgotPassword(@Body() body: ForgotPasswordInput): Promise<void> {
    await this.passwordReset.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @UsePipes(new ZodValidationPipe(resetPasswordInputSchema))
  @ApiOperation({
    summary: 'Reset the password using the token from the email and revoke sessions',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiNoContentResponse({ description: 'Password reset successful' })
  async resetPassword(@Body() body: ResetPasswordInput): Promise<void> {
    await this.passwordReset.resetPassword(body.token, body.password);
  }

  @Get('google')
  @UseGuards(GoogleStartGuard)
  @ApiOperation({ summary: 'Start the Google OAuth flow' })
  startGoogle(): { redirecting: boolean } {
    return { redirecting: true };
  }

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  @ApiOperation({ summary: 'Handle the Google OAuth callback and complete sign-in' })
  async googleCallback(
    @Req() req: FastifyRequest & { user?: User },
    @Res({ passthrough: false }) res: FastifyReply,
  ): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_OAUTH_FAILED',
        message: 'OAuth sign-in failed',
      });
    }

    const session = await this.auth.completeOAuthSignIn(user, this.requestContext(req));
    this.setRefreshCookie(res, session.tokens.refreshToken, session.tokens.refreshExpiresAt);

    const redirect = new URL(this.env.appBaseUrl);
    redirect.pathname = '/auth/callback';
    redirect.hash = `accessToken=${encodeURIComponent(session.tokens.accessToken)}`;

    void res.redirect(redirect.toString(), HttpStatus.FOUND);
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
