import { ServiceUnavailableException } from '@nestjs/common';

import { type EnvService } from '../config/env.service';

import { IgdbService, type IgdbGameRaw } from './igdb.service';
import { type TwitchAuthService } from './twitch-auth.service';

function buildService() {
  const env: Pick<EnvService, 'twitchClientId'> = { twitchClientId: 'fake-client-id' };
  const getAccessToken = jest.fn().mockResolvedValue('fake-bearer-token');
  const invalidate = jest.fn();
  const twitchAuth = { getAccessToken, invalidate } as unknown as TwitchAuthService;
  return {
    service: new IgdbService(env as EnvService, twitchAuth),
    getAccessToken,
    invalidate,
  };
}

function mockFetch(handler: (body: string) => Response | Promise<Response>) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
    const raw = init?.body;
    const body = typeof raw === 'string' ? raw : '';
    return Promise.resolve(handler(body));
  });
}

const SAMPLE_RAW: IgdbGameRaw = {
  id: 1942,
  name: 'The Witcher 3: Wild Hunt',
  slug: 'the-witcher-3-wild-hunt',
  summary: 'Open world RPG',
  cover: { id: 1, image_id: 'co1wyy' },
  first_release_date: 1431993600,
  platforms: [{ id: 6, name: 'PC' }],
  genres: [{ id: 12, name: 'Role-playing (RPG)' }],
  rating: 92.5,
  rating_count: 4500,
};

describe('IgdbService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('search', () => {
    it('returns normalized game when query matches', async () => {
      const { service } = buildService();
      mockFetch(() => new Response(JSON.stringify([SAMPLE_RAW]), { status: 200 }));

      const results = await service.search('witcher');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        igdbId: 1942,
        slug: 'the-witcher-3-wild-hunt',
        title: 'The Witcher 3: Wild Hunt',
        platforms: ['PC'],
        genres: ['Role-playing (RPG)'],
      });
      expect(results[0]?.coverUrl).toBe(
        'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
      );
      expect(results[0]?.releaseDate).toBe(new Date(1431993600 * 1000).toISOString());
    });

    it('returns empty array when query is only special chars', async () => {
      const { service } = buildService();
      const fetchSpy = mockFetch(() => new Response('[]', { status: 200 }));

      const results = await service.search('";\\');
      expect(results).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('strips quotes, backslashes, and semicolons from query', async () => {
      const { service } = buildService();
      let capturedBody = '';
      mockFetch((body) => {
        capturedBody = body;
        return new Response('[]', { status: 200 });
      });

      await service.search('zelda"; remove --');
      const searchMatch = /search "([^"]+)"/.exec(capturedBody);
      expect(searchMatch?.[1]).toBe('zelda remove --');
      expect(searchMatch?.[1]).not.toContain('"');
      expect(searchMatch?.[1]).not.toContain(';');
    });

    it('clamps limit to [1, 50]', async () => {
      const { service } = buildService();
      let capturedBody = '';
      mockFetch((body) => {
        capturedBody = body;
        return new Response('[]', { status: 200 });
      });

      await service.search('zelda', 999);
      expect(capturedBody).toContain('limit 50;');

      await service.search('zelda', 0);
      expect(capturedBody).toContain('limit 1;');
    });

    it('caps query length at 200 chars', async () => {
      const { service } = buildService();
      let capturedBody = '';
      mockFetch((body) => {
        capturedBody = body;
        return new Response('[]', { status: 200 });
      });

      const longQuery = 'a'.repeat(500);
      await service.search(longQuery);
      const match = /search "([^"]+)"/.exec(capturedBody);
      expect(match?.[1]?.length).toBe(200);
    });

    it('throws ServiceUnavailable on fetch failure', async () => {
      const { service } = buildService();
      mockFetch(() => Promise.reject(new Error('network down')));

      await expect(service.search('zelda')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('invalidates Twitch token on 401', async () => {
      const { service, invalidate } = buildService();
      mockFetch(() => new Response('', { status: 401 }));

      await expect(service.search('zelda')).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(invalidate).toHaveBeenCalledTimes(1);
    });

    it('throws ServiceUnavailable on non-OK without invalidating', async () => {
      const { service, invalidate } = buildService();
      mockFetch(() => new Response('', { status: 503 }));

      await expect(service.search('zelda')).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(invalidate).not.toHaveBeenCalled();
    });
  });

  describe('findByIgdbId', () => {
    it('returns null when IGDB returns empty array', async () => {
      const { service } = buildService();
      mockFetch(() => new Response('[]', { status: 200 }));

      const result = await service.findByIgdbId(999_999);
      expect(result).toBeNull();
    });

    it('queries by id with where clause', async () => {
      const { service } = buildService();
      let capturedBody = '';
      mockFetch((body) => {
        capturedBody = body;
        return new Response(JSON.stringify([SAMPLE_RAW]), { status: 200 });
      });

      const result = await service.findByIgdbId(1942);
      expect(capturedBody).toContain('where id = 1942;');
      expect(result?.igdbId).toBe(1942);
    });
  });

  describe('normalize', () => {
    it('handles missing optional fields gracefully', async () => {
      const { service } = buildService();
      mockFetch(
        () =>
          new Response(JSON.stringify([{ id: 1, name: 'Bare Game', slug: 'bare-game' }]), {
            status: 200,
          }),
      );

      const [result] = await service.search('bare');
      expect(result).toEqual({
        igdbId: 1,
        slug: 'bare-game',
        title: 'Bare Game',
        platforms: [],
        genres: [],
      });
    });
  });
});
