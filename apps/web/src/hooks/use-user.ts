'use client';

import { type PublicUser } from '@tracklistd/shared';

import { useAuthStore } from '@/stores/auth-store';

interface UseUserResult {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useUser(): UseUserResult {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  return {
    user,
    isAuthenticated: status === 'authenticated' && user !== null,
    isLoading: status === 'idle' || status === 'loading',
  };
}
