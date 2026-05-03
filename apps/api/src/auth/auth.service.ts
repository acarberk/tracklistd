import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { type User } from '@prisma/client';
import { type LoginInput, type PublicUser, type RegisterInput } from '@tracklistd/shared';

import { UserService } from '../user/user.service';

import { EmailVerificationService } from './email-verification.service';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface AuthSession {
  user: PublicUser;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly tokens: TokenService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  async register(input: RegisterInput): Promise<{ userId: string; email: string }> {
    const existingByEmail = await this.users.findByEmail(input.email);
    const existingByUsername = await this.users.findByUsername(input.username);

    if (existingByEmail || existingByUsername) {
      await this.passwords.hash(input.password);

      this.logger.log({
        event: 'register_conflict',
        emailTaken: Boolean(existingByEmail),
        usernameTaken: Boolean(existingByUsername),
      });

      throw new ConflictException({
        code: 'AUTH_REGISTRATION_FAILED',
        message: 'Could not complete registration',
      });
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.createWithPassword({
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash,
    });

    try {
      await this.emailVerification.issueAndSend(user.id, user.email, user.displayName);
    } catch (error) {
      this.logger.error({ event: 'verification_email_send_failed', userId: user.id, error });
    }

    return { userId: user.id, email: user.email };
  }

  async login(input: LoginInput, context: RequestContext): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }

    const verification = await this.passwords.verify(input.password, user.passwordHash);
    if (!verification.ok) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }

    if (verification.needsRehash) {
      const newHash = await this.passwords.hash(input.password);
      await this.users.updatePasswordHash(user.id, newHash);
    }

    const accessToken = await this.jwt.signAccessToken({
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    const refresh = await this.tokens.issueRefreshToken({
      userId: user.id,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken: refresh.rawToken,
        refreshExpiresAt: refresh.expiresAt,
      },
    };
  }

  async refresh(rawRefreshToken: string, context: RequestContext): Promise<AuthTokens> {
    const consumed = await this.tokens.consumeRefreshToken(rawRefreshToken, context);

    const user = await this.users.findById(consumed.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const accessToken = await this.jwt.signAccessToken({
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    return {
      accessToken,
      refreshToken: consumed.reissued.rawToken,
      refreshExpiresAt: consumed.reissued.expiresAt,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(rawRefreshToken);
  }

  async logoutEverywhere(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }

  async completeOAuthSignIn(user: User, context: RequestContext): Promise<AuthSession> {
    const accessToken = await this.jwt.signAccessToken({
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    const refresh = await this.tokens.issueRefreshToken({
      userId: user.id,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken: refresh.rawToken,
        refreshExpiresAt: refresh.expiresAt,
      },
    };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toPublicUser(user);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    emailVerified: boolean;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    };
  }
}
