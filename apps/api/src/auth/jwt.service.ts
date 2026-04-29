import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

import { EnvService } from '../config/env.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  family: string;
  rotation: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly nest: NestJwtService,
    private readonly env: EnvService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.nest.signAsync(payload, {
      secret: this.env.jwtAccessSecret,
      expiresIn: this.env.jwtAccessTtl as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`,
    });
  }

  signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.nest.signAsync(payload, {
      secret: this.env.jwtRefreshSecret,
      expiresIn: this.env.jwtRefreshTtl as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`,
    });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.nest.verifyAsync<AccessTokenPayload>(token, {
      secret: this.env.jwtAccessSecret,
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.nest.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.env.jwtRefreshSecret,
    });
  }
}
