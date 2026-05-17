'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginInputSchema, type LoginInput, type LoginOutput } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, extractApiError } from '@/lib/api-client';

export default function LoginPage(): ReactNode {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('auth.common');
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' } satisfies LoginInput,
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginInput): Promise<LoginOutput> => {
      const response = await apiClient.post<LoginOutput>('/auth/login', data);
      return response.data;
    },
    onSuccess: () => {
      setApiError(null);
      router.push('/');
    },
    onError: (error) => {
      const apiErr = extractApiError(error);
      setApiError(
        apiErr.code === 'AUTH_INVALID_CREDENTIALS'
          ? t('errors.invalid')
          : tCommon('errors.unknown'),
      );
    },
  });

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
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{tCommon('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={tCommon('emailPlaceholder')}
              disabled={mutation.isPending}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{tCommon('password')}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {t('forgotPasswordLink')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
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

          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
              {t('registerLink')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
