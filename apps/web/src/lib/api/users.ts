import { type PublicProfileOutput, type PublicUserGamesOutput } from '@tracklistd/shared';

import { apiClient } from '../api-client';

export async function getPublicProfile(username: string): Promise<PublicProfileOutput> {
  const response = await apiClient.get<PublicProfileOutput>(
    `/users/${encodeURIComponent(username)}`,
  );
  return response.data;
}

export async function getPublicUserGames(
  username: string,
  limit = 12,
): Promise<PublicUserGamesOutput> {
  const response = await apiClient.get<PublicUserGamesOutput>(
    `/users/${encodeURIComponent(username)}/games`,
    { params: { limit } },
  );
  return response.data;
}
