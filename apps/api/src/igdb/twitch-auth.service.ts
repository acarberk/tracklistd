import { Inject, Injectable, Logger } from '@nestjs/common';

import { EnvService } from '../config/env.service';
import { REDIS_CLIENT } from '../redis/redis.module';

import type Redis from 'ioredis';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const REDIS_KEY = 'twitch:app_token';
const REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

@Injectable()
export class TwitchAuthService {
  private readonly logger = new Logger(TwitchAuthService.name);
  private inflight: Promise<string> | null = null;

  constructor(
    private readonly env: EnvService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getAccessToken(): Promise<string> {
    const cached = await this.readCached();
    if (cached && cached.expiresAt > Date.now() + REFRESH_MARGIN_MS) {
      return cached.token;
    }

    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.refreshToken().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  async invalidate(): Promise<void> {
    await this.redis.del(REDIS_KEY);
  }

  private async readCached(): Promise<CachedToken | null> {
    const raw = await this.redis.get(REDIS_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as CachedToken;
      if (typeof parsed.token === 'string' && typeof parsed.expiresAt === 'number') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async refreshToken(): Promise<string> {
    const url = new URL(this.env.twitchTokenUrl);
    url.searchParams.set('client_id', this.env.twitchClientId);
    url.searchParams.set('client_secret', this.env.twitchClientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: 'POST',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error({ event: 'twitch_token_fetch_failed', error });
      throw new Error('Twitch token request failed');
    }

    if (!response.ok) {
      this.logger.error({
        event: 'twitch_token_non_ok',
        status: response.status,
      });
      throw new Error(`Twitch token request returned ${String(response.status)}`);
    }

    const data = (await response.json()) as TokenResponse;
    const expiresAt = Date.now() + data.expires_in * 1000;
    const cached: CachedToken = { token: data.access_token, expiresAt };

    await this.redis.set(REDIS_KEY, JSON.stringify(cached), 'PX', data.expires_in * 1000);

    this.logger.log({
      event: 'twitch_token_refreshed',
      expiresInDays: Math.round(data.expires_in / 86400),
    });

    return data.access_token;
  }
}
