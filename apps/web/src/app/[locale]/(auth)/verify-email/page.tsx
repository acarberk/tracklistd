'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, type ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { fetchMe } from '@/lib/api/auth';
import { apiClient, extractApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function VerifyEmailPage(): ReactNode {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailFallback(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

function VerifyEmailContent(): ReactNode {
  const t = useTranslations('auth.verifyEmail');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { isAuthenticated } = useUser();

  const query = useQuery({
    queryKey: ['verifyEmail', token],
    queryFn: async () => {
      await apiClient.get('/auth/verify-email', { params: { token } });
      return true;
    },
    enabled: token.length > 0,
    retry: false,
  });

  useEffect(() => {
    if (!query.isSuccess || !isAuthenticated) {
      return;
    }
    void (async () => {
      const user = await fetchMe();
      const accessToken = useAuthStore.getState().accessToken;
      if (user && accessToken) {
        useAuthStore.getState().setSession(accessToken, user);
      }
    })();
  }, [query.isSuccess, isAuthenticated]);

  if (token.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('missingToken.title')}</CardTitle>
          <CardDescription>{t('missingToken.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('loading.title')}</CardTitle>
          <CardDescription>{t('loading.description')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (query.isError) {
    const err = extractApiError(query.error);
    const message =
      err.code === 'AUTH_VERIFICATION_TOKEN_EXPIRED'
        ? t('errors.expired')
        : err.code === 'AUTH_VERIFICATION_TOKEN_INVALID'
          ? t('errors.invalid')
          : t('errors.unknown');

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('errors.title')}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link
            href="/login"
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('success.title')}</CardTitle>
        <CardDescription>{t('success.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <Link href="/" className="text-sm text-foreground underline-offset-4 hover:underline">
            {t('success.continue')}
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {t('success.goToLogin')}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
