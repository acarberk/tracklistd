import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { type User } from '@prisma/client';

import { UserService } from '../user/user.service';
import { generateUniqueUsername } from '../user/username-generator';

export interface GoogleProfileInput {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(private readonly users: UserService) {}

  async upsertFromGoogle(input: GoogleProfileInput): Promise<User> {
    const byGoogle = await this.users.findByGoogleId(input.googleId);
    if (byGoogle) {
      return byGoogle;
    }

    const byEmail = await this.users.findByEmail(input.email);
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== input.googleId) {
        this.logger.warn({
          event: 'oauth_conflict',
          provider: 'google',
          email: input.email,
        });
        throw new ConflictException({
          code: 'INTEGRATION_ALREADY_LINKED',
          message: 'This email is already linked to a different Google account',
        });
      }
      return this.users.linkGoogleId(byEmail.id, input.googleId);
    }

    const fallback = input.email.split('@')[0] ?? 'user';
    const baseInput = input.displayName.trim().length > 0 ? input.displayName : fallback;

    const username = await generateUniqueUsername(
      baseInput,
      async (candidate) => (await this.users.findByUsername(candidate)) === null,
    );

    return this.users.createFromOAuth({
      email: input.email,
      username,
      displayName: input.displayName.trim() || username,
      provider: 'google',
      providerId: input.googleId,
    });
  }
}
