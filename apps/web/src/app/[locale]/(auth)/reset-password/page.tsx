'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { resetPasswordInputSchema, type ResetPasswordInput } from '@tracklistd/shared';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { apiClient, extractApiError } from '@/lib/api-client';

export default function ResetPasswordPage(): ReactNode {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordFallback(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>&nbsp;</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-9 animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}

function ResetPasswordForm(): ReactNode {
  const t = useTranslations('auth.resetPassword');
  const tCommon = useTranslations('auth.common');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordInputSchema),
    defaultValues: { token, password: '' } satisfies ResetPasswordInput,
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordInput): Promise<void> => {
      await apiClient.post('/auth/reset-password', data);
    },
    onSuccess: () => {
      setApiError(null);
      setSuccess(true);
    },
    onError: (error) => {
      const apiErr = extractApiError(error);
      if (apiErr.code === 'AUTH_RESET_TOKEN_INVALID') {
        setApiError(t('errors.invalidToken'));
      } else if (apiErr.code === 'AUTH_RESET_TOKEN_EXPIRED') {
        setApiError(t('errors.expiredToken'));
      } else {
        setApiError(tCommon('errors.unknown'));
      }
    },
  });

  if (token.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('missingToken.title')}</CardTitle>
          <CardDescription>{t('missingToken.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/forgot-password"
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {t('missingToken.requestNew')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('success.title')}</CardTitle>
          <CardDescription>{t('success.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {t('success.goToLogin')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            void form.handleSubmit((data) => {
              mutation.mutate(data);
            })(event);
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <input type="hidden" {...form.register('token')} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t('newPasswordLabel')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={mutation.isPending}
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {apiError && (
            <p className="text-sm text-destructive" role="alert">
              {apiError}
            </p>
          )}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? tCommon('submitting') : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
