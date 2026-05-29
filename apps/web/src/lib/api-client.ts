import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/auth-store';

// process.env.NEXT_PUBLIC_API_URL is typed as string by Next.js types but may be
// empty at runtime. Using || (not ??) so empty string falls back to the default.
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10_000,
});

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  status?: number;
  retryAfterSeconds?: number;
}

function parseRetryAfterSeconds(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return undefined;
  }
  return Number(value);
}

export function extractApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
    return {
      ...error.response.data,
      status: error.response.status,
      retryAfterSeconds: parseRetryAfterSeconds(error.response.headers['retry-after']),
    };
  }
  return {};
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RefreshResponse {
  accessToken: string;
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
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

async function getFreshToken(): Promise<string | null> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response || !error.config) {
      throw error;
    }
    const original = error.config as RetryConfig;
    const url = original.url ?? '';
    const isRefreshCall = url.includes('/auth/refresh');
    const isLoginCall = url.includes('/auth/login');
    if (error.response.status !== 401 || original._retry === true || isRefreshCall || isLoginCall) {
      throw error;
    }

    original._retry = true;
    const newToken = await getFreshToken();
    if (!newToken) {
      useAuthStore.getState().clearSession();
      throw error;
    }

    const store = useAuthStore.getState();
    if (store.user) {
      store.setSession(newToken, store.user);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  },
);
