import { type EnvService } from '../config/env.service';

import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  function buildService(overrides: Partial<{ secret: string; verifyUrl: string }> = {}) {
    const env: Pick<EnvService, 'turnstileSecret' | 'turnstileVerifyUrl' | 'isTurnstileEnabled'> = {
      turnstileSecret: overrides.secret ?? '',
      turnstileVerifyUrl: overrides.verifyUrl ?? VERIFY_URL,
      isTurnstileEnabled: Boolean(overrides.secret),
    };
    return new TurnstileService(env as EnvService);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isEnabled', () => {
    it('returns false when secret is empty', () => {
      const service = buildService();
      expect(service.isEnabled).toBe(false);
    });

    it('returns true when secret is configured', () => {
      const service = buildService({ secret: 'test-secret' });
      expect(service.isEnabled).toBe(true);
    });
  });

  describe('verify', () => {
    it('returns true without calling fetch when secret is empty', async () => {
      const service = buildService();
      const fetchSpy = jest.spyOn(globalThis, 'fetch');
      const ok = await service.verify('any-token', '1.2.3.4');
      expect(ok).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('posts secret + response + remoteip and returns true on success', async () => {
      const service = buildService({ secret: 'my-secret' });
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

      const ok = await service.verify('user-token', '8.8.8.8');
      expect(ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const call = fetchSpy.mock.calls[0];
      expect(call?.[0]).toBe(VERIFY_URL);
      const body = call?.[1]?.body;
      expect(body).toBeInstanceOf(URLSearchParams);
      const params = body as URLSearchParams;
      expect(params.get('secret')).toBe('my-secret');
      expect(params.get('response')).toBe('user-token');
      expect(params.get('remoteip')).toBe('8.8.8.8');
    });

    it('omits remoteip when ip is undefined', async () => {
      const service = buildService({ secret: 'my-secret' });
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

      await service.verify('user-token', undefined);
      const body = fetchSpy.mock.calls[0]?.[1]?.body;
      expect(body).toBeInstanceOf(URLSearchParams);
      const params = body as URLSearchParams;
      expect(params.get('remoteip')).toBeNull();
    });

    it('returns false when siteverify reports failure', async () => {
      const service = buildService({ secret: 'my-secret' });
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }),
          {
            status: 200,
          },
        ),
      );

      const ok = await service.verify('bad-token', '1.2.3.4');
      expect(ok).toBe(false);
    });

    it('returns false on non-2xx siteverify response', async () => {
      const service = buildService({ secret: 'my-secret' });
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));

      const ok = await service.verify('user-token', '1.2.3.4');
      expect(ok).toBe(false);
    });

    it('returns false when fetch throws', async () => {
      const service = buildService({ secret: 'my-secret' });
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

      const ok = await service.verify('user-token', '1.2.3.4');
      expect(ok).toBe(false);
    });
  });
});
