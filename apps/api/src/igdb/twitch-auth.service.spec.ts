import { type EnvService } from '../config/env.service';

import { TwitchAuthService } from './twitch-auth.service';

import type Redis from 'ioredis';

function buildService() {
  const env: Pick<EnvService, 'twitchClientId' | 'twitchClientSecret'> = {
    twitchClientId: 'fake-client-id',
    twitchClientSecret: 'fake-client-secret',
  };
  const redisGet = jest.fn();
  const redisSet = jest.fn();
  const redisDel = jest.fn();
  const redis = { get: redisGet, set: redisSet, del: redisDel } as unknown as Redis;
  return {
    service: new TwitchAuthService(env as EnvService, redis),
    redisGet,
    redisSet,
    redisDel,
  };
}

function tokenResponse(token: string, expiresInSec: number): Response {
  return new Response(
    JSON.stringify({ access_token: token, expires_in: expiresInSec, token_type: 'bearer' }),
    { status: 200 },
  );
}

describe('TwitchAuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAccessToken', () => {
    it('returns cached token when still within refresh margin', async () => {
      const { service, redisGet } = buildService();
      const cached = {
        token: 'cached-token',
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      redisGet.mockResolvedValue(JSON.stringify(cached));
      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      const result = await service.getAccessToken();
      expect(result).toBe('cached-token');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('refreshes when cached token is within refresh margin', async () => {
      const { service, redisGet } = buildService();
      const cached = {
        token: 'stale-token',
        expiresAt: Date.now() + 60_000,
      };
      redisGet.mockResolvedValue(JSON.stringify(cached));
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(tokenResponse('fresh-token', 5_000_000));

      const result = await service.getAccessToken();
      expect(result).toBe('fresh-token');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('refreshes when cache is empty', async () => {
      const { service, redisGet } = buildService();
      redisGet.mockResolvedValue(null);
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(tokenResponse('new-token', 5_000_000));

      const result = await service.getAccessToken();
      expect(result).toBe('new-token');
    });

    it('ignores malformed cache entries and refreshes', async () => {
      const { service, redisGet } = buildService();
      redisGet.mockResolvedValue('not-valid-json{{');
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(tokenResponse('refreshed', 5_000_000));

      const result = await service.getAccessToken();
      expect(result).toBe('refreshed');
    });

    it('persists fresh token to redis with PX ttl', async () => {
      const { service, redisGet, redisSet } = buildService();
      redisGet.mockResolvedValue(null);
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(tokenResponse('token-1', 5_000_000));

      await service.getAccessToken();

      expect(redisSet).toHaveBeenCalledTimes(1);
      const call = redisSet.mock.calls[0];
      expect(call?.[0]).toBe('twitch:app_token');
      expect(JSON.parse(String(call?.[1]))).toMatchObject({ token: 'token-1' });
      expect(call?.[2]).toBe('PX');
      expect(call?.[3]).toBe(5_000_000 * 1000);
    });

    it('dedups concurrent refreshes into a single fetch', async () => {
      const { service, redisGet } = buildService();
      redisGet.mockResolvedValue(null);
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(tokenResponse('dedup-token', 5_000_000));

      const [a, b, c] = await Promise.all([
        service.getAccessToken(),
        service.getAccessToken(),
        service.getAccessToken(),
      ]);
      expect(a).toBe('dedup-token');
      expect(b).toBe('dedup-token');
      expect(c).toBe('dedup-token');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('throws when Twitch returns non-OK', async () => {
      const { service, redisGet } = buildService();
      redisGet.mockResolvedValue(null);
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));

      await expect(service.getAccessToken()).rejects.toThrow(/Twitch token request returned 500/);
    });

    it('throws when fetch rejects', async () => {
      const { service, redisGet } = buildService();
      redisGet.mockResolvedValue(null);
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

      await expect(service.getAccessToken()).rejects.toThrow(/Twitch token request failed/);
    });
  });

  describe('invalidate', () => {
    it('deletes the redis key', async () => {
      const { service, redisDel } = buildService();
      await service.invalidate();
      expect(redisDel).toHaveBeenCalledWith('twitch:app_token');
    });
  });
});
