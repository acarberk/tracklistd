import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';

import { EnvService } from '../config/env.service';

import { OAuthService, type GoogleProfileInput } from './oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    env: EnvService,
    private readonly oauth: OAuthService,
  ) {
    if (!env.googleClientId || !env.googleClientSecret) {
      throw new InternalServerErrorException(
        'Google OAuth is not configured (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)',
      );
    }

    super({
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        throw new InternalServerErrorException('Google account has no email');
      }

      const input: GoogleProfileInput = {
        googleId: profile.id,
        email,
        emailVerified: profile.emails?.[0]?.verified === true,
        displayName: profile.displayName,
      };

      const user = await this.oauth.upsertFromGoogle(input);
      done(null, user);
    } catch (error) {
      done(error instanceof Error ? error : new Error('OAuth validation failed'), undefined);
    }
  }
}
