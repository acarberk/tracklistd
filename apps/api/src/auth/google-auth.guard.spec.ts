import { ServiceUnavailableException } from '@nestjs/common';

import { type EnvService } from '../config/env.service';

import { GoogleOAuthConfiguredGuard } from './google-auth.guard';

function buildEnv(configured: boolean): EnvService {
  return { isGoogleOAuthConfigured: configured } as unknown as EnvService;
}

describe('GoogleOAuthConfiguredGuard', () => {
  it('returns true when env is configured', () => {
    const guard = new GoogleOAuthConfiguredGuard(buildEnv(true));
    expect(guard.canActivate()).toBe(true);
  });

  it('throws AUTH_OAUTH_NOT_CONFIGURED when env is missing', () => {
    const guard = new GoogleOAuthConfiguredGuard(buildEnv(false));
    expect(() => guard.canActivate()).toThrow(ServiceUnavailableException);
    try {
      guard.canActivate();
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: 'AUTH_OAUTH_NOT_CONFIGURED' },
      });
    }
  });
});
