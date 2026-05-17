'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { registerInputSchema, type RegisterInput, type RegisterOutput } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { apiClient, extractApiError } from '@/lib/api-client';

export default function RegisterPage(): ReactNode {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('auth.common');
  const [apiError, setApiError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
      displayName: '',
    } satisfies RegisterInput,
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterInput): Promise<RegisterOutput> => {
      const response = await apiClient.post<RegisterOutput>('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      setApiError(null);
      setRegistered(true);
    },
    onError: (error) => {
      const apiErr = extractApiError(error);
      if (apiErr.code === 'AUTH_EMAIL_TAKEN') {
        setApiError(t('errors.emailTaken'));
      } else if (apiErr.code === 'AUTH_USERNAME_TAKEN') {
        setApiError(t('errors.usernameTaken'));
      } else {
        setApiError(tCommon('errors.unknown'));
      }
    },
  });

  if (registered) {
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
            <Label htmlFor="username">{t('username')}</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder={t('usernamePlaceholder')}
              disabled={mutation.isPending}
              {...form.register('username')}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              type="text"
              autoComplete="name"
              placeholder={t('displayNamePlaceholder')}
              disabled={mutation.isPending}
              {...form.register('displayName')}
            />
            {form.formState.errors.displayName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{tCommon('password')}</Label>
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

          <p className="text-center text-sm text-muted-foreground">
            {t('haveAccount')}{' '}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              {t('loginLink')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
