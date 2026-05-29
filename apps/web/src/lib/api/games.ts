import { type GameDetailOutput, type GameSearchOutput } from '@tracklistd/shared';

import { apiClient } from '../api-client';

export async function searchGames(query: string, limit = 20): Promise<GameSearchOutput> {
  const response = await apiClient.get<GameSearchOutput>('/games/search', {
    params: { q: query, limit },
  });
  return response.data;
}

export async function popularGames(limit = 12): Promise<GameSearchOutput> {
  const response = await apiClient.get<GameSearchOutput>('/games/popular', {
    params: { limit },
  });
  return response.data;
}

export async function getGameBySlug(slug: string): Promise<GameDetailOutput> {
  const response = await apiClient.get<GameDetailOutput>(`/games/${encodeURIComponent(slug)}`);
  return response.data;
}
