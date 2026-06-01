import {
  type AddUserGameInput,
  type ListUserGamesOutput,
  type ListUserGamesQuery,
  type UpdateUserGameInput,
  type UserGameOutput,
} from '@tracklistd/shared';
import { isAxiosError } from 'axios';

import { apiClient } from '../api-client';

export async function addUserGame(input: AddUserGameInput): Promise<UserGameOutput> {
  const response = await apiClient.post<UserGameOutput>('/users/me/games', input);
  return response.data;
}

export async function listUserGames(query: ListUserGamesQuery): Promise<ListUserGamesOutput> {
  const response = await apiClient.get<ListUserGamesOutput>('/users/me/games', {
    params: query,
  });
  return response.data;
}

export async function updateUserGame(
  id: string,
  input: UpdateUserGameInput,
): Promise<UserGameOutput> {
  const response = await apiClient.patch<UserGameOutput>(`/users/me/games/${id}`, input);
  return response.data;
}

export async function deleteUserGame(id: string): Promise<void> {
  await apiClient.delete(`/users/me/games/${id}`);
}

export async function getUserGameByIgdb(igdbId: number): Promise<UserGameOutput | null> {
  try {
    const response = await apiClient.get<UserGameOutput>(
      `/users/me/games/by-igdb/${String(igdbId)}`,
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
