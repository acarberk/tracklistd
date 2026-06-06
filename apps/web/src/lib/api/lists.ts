import {
  type CreateListInput,
  type GameListDetail,
  type GameListsOutput,
  type UpdateListInput,
} from '@tracklistd/shared';

import { apiClient } from '../api-client';

export async function getLists(): Promise<GameListsOutput> {
  const response = await apiClient.get<GameListsOutput>('/users/me/lists');
  return response.data;
}

export async function getList(id: string): Promise<GameListDetail> {
  const response = await apiClient.get<GameListDetail>(`/users/me/lists/${encodeURIComponent(id)}`);
  return response.data;
}

export async function createList(input: CreateListInput): Promise<GameListDetail> {
  const response = await apiClient.post<GameListDetail>('/users/me/lists', input);
  return response.data;
}

export async function updateList(id: string, input: UpdateListInput): Promise<GameListDetail> {
  const response = await apiClient.patch<GameListDetail>(
    `/users/me/lists/${encodeURIComponent(id)}`,
    input,
  );
  return response.data;
}

export async function deleteList(id: string): Promise<void> {
  await apiClient.delete(`/users/me/lists/${encodeURIComponent(id)}`);
}

export async function addListItem(id: string, igdbId: number): Promise<GameListDetail> {
  const response = await apiClient.post<GameListDetail>(
    `/users/me/lists/${encodeURIComponent(id)}/items`,
    { igdbId },
  );
  return response.data;
}

export async function removeListItem(id: string, itemId: string): Promise<GameListDetail> {
  const response = await apiClient.delete<GameListDetail>(
    `/users/me/lists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
  );
  return response.data;
}
