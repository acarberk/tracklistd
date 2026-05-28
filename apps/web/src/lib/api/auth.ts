import {
  type PublicUser,
  type UpdateProfileInput,
  type UserProfileOutput,
} from '@tracklistd/shared';
import axios from 'axios';

import { apiClient } from '../api-client';

interface RefreshResponse {
  accessToken: string;
}

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function refreshSession(): Promise<string | null> {
  try {
    const response = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, undefined, {
      withCredentials: true,
      timeout: 10_000,
    });
    return response.data.accessToken;
  } catch {
    return null;
  }
}

export async function fetchMe(): Promise<PublicUser | null> {
  try {
    const response = await apiClient.get<PublicUser>('/auth/me');
    return response.data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // ignore; we clear local state anyway
  }
}

export async function resendVerification(email: string): Promise<void> {
  await apiClient.post('/auth/resend-verification', { email });
}

export async function getProfile(): Promise<UserProfileOutput> {
  const response = await apiClient.get<UserProfileOutput>('/users/me');
  return response.data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfileOutput> {
  const response = await apiClient.patch<UserProfileOutput>('/users/me', input);
  return response.data;
}
