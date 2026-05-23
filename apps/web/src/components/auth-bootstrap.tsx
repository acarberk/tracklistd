'use client';

import { useEffect, type ReactNode } from 'react';

import { fetchMe, refreshSession } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function AuthBootstrap({ children }: { children: ReactNode }): ReactNode {
  useEffect(() => {
    const store = useAuthStore.getState();
    if (store.status !== 'idle') {
      return;
    }
    store.setStatus('loading');

    void (async () => {
      const token = await refreshSession();
      if (!token) {
        useAuthStore.getState().clearSession();
        return;
      }
      useAuthStore.setState({ accessToken: token, status: 'loading' });
      const user = await fetchMe();
      if (user) {
        useAuthStore.getState().setSession(token, user);
      } else {
        useAuthStore.getState().clearSession();
      }
    })();
  }, []);

  return <>{children}</>;
}
