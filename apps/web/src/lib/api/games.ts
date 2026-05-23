import { type GameSearchOutput } from '@tracklistd/shared';

import { apiClient } from '../api-client';

export async function searchGames(query: string, limit = 20): Promise<GameSearchOutput> {
  const response = await apiClient.get<GameSearchOutput>('/games/search', {
    params: { q: query, limit },
  });
  return response.data;
}
