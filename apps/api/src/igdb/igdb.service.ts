import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import { EnvService } from '../config/env.service';

import { TwitchAuthService } from './twitch-auth.service';

export interface IgdbGameRaw {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  cover?: { id: number; image_id: string };
  first_release_date?: number;
  platforms?: { id: number; name: string }[];
  genres?: { id: number; name: string }[];
  rating?: number;
  rating_count?: number;
}

export interface IgdbGame {
  igdbId: number;
  slug: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  releaseDate?: string;
  platforms: string[];
  genres: string[];
  igdbRating?: number;
  igdbRatingCount?: number;
}

const IGDB_API_URL = 'https://api.igdb.com/v4';
const FETCH_TIMEOUT_MS = 10_000;
const MAX_QUERY_LENGTH = 200;
const SEARCH_FIELDS =
  'fields id, name, slug, summary, cover.image_id, first_release_date, platforms.name, genres.name, rating, rating_count;';

@Injectable()
export class IgdbService {
  private readonly logger = new Logger(IgdbService.name);

  constructor(
    private readonly env: EnvService,
    private readonly twitchAuth: TwitchAuthService,
  ) {}

  async search(query: string, limit = 20): Promise<IgdbGame[]> {
    const safeQuery = this.sanitizeQuery(query);
    if (safeQuery.length === 0) {
      return [];
    }

    const body = [
      SEARCH_FIELDS,
      `search "${safeQuery}";`,
      `limit ${String(Math.min(Math.max(limit, 1), 50))};`,
    ].join(' ');

    const raw = await this.requestGames(body);
    return raw.map((item) => this.normalize(item));
  }

  async findByIgdbId(igdbId: number): Promise<IgdbGame | null> {
    const body = [SEARCH_FIELDS, `where id = ${String(igdbId)};`, 'limit 1;'].join(' ');
    const raw = await this.requestGames(body);
    return raw.length > 0 && raw[0] ? this.normalize(raw[0]) : null;
  }

  async findBySlug(slug: string): Promise<IgdbGame | null> {
    const safeSlug = slug.replace(/["\\;]/g, '').slice(0, 200);
    if (safeSlug.length === 0) {
      return null;
    }
    const body = [SEARCH_FIELDS, `where slug = "${safeSlug}";`, 'limit 1;'].join(' ');
    const raw = await this.requestGames(body);
    return raw.length > 0 && raw[0] ? this.normalize(raw[0]) : null;
  }

  private sanitizeQuery(input: string): string {
    return input
      .trim()
      .slice(0, MAX_QUERY_LENGTH)
      .replace(/["\\;]/g, '')
      .replace(/\s+/g, ' ');
  }

  private normalize(raw: IgdbGameRaw): IgdbGame {
    const result: IgdbGame = {
      igdbId: raw.id,
      slug: raw.slug,
      title: raw.name,
      platforms: raw.platforms?.map((p) => p.name) ?? [],
      genres: raw.genres?.map((g) => g.name) ?? [],
    };
    if (raw.summary) {
      result.summary = raw.summary;
    }
    if (raw.cover?.image_id) {
      result.coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${raw.cover.image_id}.jpg`;
    }
    if (typeof raw.first_release_date === 'number') {
      result.releaseDate = new Date(raw.first_release_date * 1000).toISOString();
    }
    if (typeof raw.rating === 'number') {
      result.igdbRating = raw.rating;
    }
    if (typeof raw.rating_count === 'number') {
      result.igdbRatingCount = raw.rating_count;
    }
    return result;
  }

  private async requestGames(body: string): Promise<IgdbGameRaw[]> {
    const token = await this.twitchAuth.getAccessToken();

    let response: Response;
    try {
      response = await fetch(`${IGDB_API_URL}/games`, {
        method: 'POST',
        headers: {
          'Client-ID': this.env.twitchClientId,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error({ event: 'igdb_request_failed', error });
      throw new ServiceUnavailableException({
        code: 'GAME_PROVIDER_UNAVAILABLE',
        message: 'Game database is temporarily unavailable',
      });
    }

    if (response.status === 401) {
      this.logger.warn({ event: 'igdb_unauthorized_invalidating_token' });
      await this.twitchAuth.invalidate();
      throw new ServiceUnavailableException({
        code: 'GAME_PROVIDER_UNAVAILABLE',
        message: 'Game database authentication expired',
      });
    }

    if (!response.ok) {
      this.logger.error({ event: 'igdb_request_non_ok', status: response.status });
      throw new ServiceUnavailableException({
        code: 'GAME_PROVIDER_UNAVAILABLE',
        message: 'Game database returned an error',
      });
    }

    return (await response.json()) as IgdbGameRaw[];
  }
}
