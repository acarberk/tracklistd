import { type PublicUser } from '@tracklistd/shared';
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: PublicUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setSession: (token: string, user: PublicUser) => void;
  clearSession: () => void;
  setStatus: (status: AuthState['status']) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'idle',
  setSession: (accessToken, user) => {
    set({ accessToken, user, status: 'authenticated' });
  },
  clearSession: () => {
    set({ accessToken: null, user: null, status: 'unauthenticated' });
  },
  setStatus: (status) => {
    set({ status });
  },
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
