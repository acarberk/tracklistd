import { type PublicProfileOutput } from '@tracklistd/shared';

import { apiClient } from '../api-client';

export async function getPublicProfile(username: string): Promise<PublicProfileOutput> {
  const response = await apiClient.get<PublicProfileOutput>(
    `/users/${encodeURIComponent(username)}`,
  );
  return response.data;
}
