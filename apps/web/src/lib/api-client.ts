import axios, { type AxiosInstance } from 'axios';

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_URL =
  typeof envApiUrl === 'string' && envApiUrl.length > 0 ? envApiUrl : 'http://localhost:3001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10_000,
});

export interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export function extractApiError(error: unknown): ApiErrorResponse {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {};
  }
  return error.response?.data ?? {};
}
