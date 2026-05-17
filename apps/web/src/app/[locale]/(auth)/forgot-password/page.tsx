'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { forgotPasswordInputSchema, type ForgotPasswordInput } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { apiClient, extractApiError } from '@/lib/api-client';

export default function ForgotPasswordPage(): ReactNode {
  const t = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('auth.common');
  const [apiError, setApiError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm({
    resolver: zodResolver(forgotPasswordInputSchema),
    defaultValues: { email: '' } satisfies ForgotPasswordInput,
  });

  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput): Promise<void> => {
      await apiClient.post('/auth/forgot-password', data);
    },
    onSuccess: () => {
      setApiError(null);
      setSent(true);
    },
    onError: (error) => {
      const apiErr = extractApiError(error);
      setApiError(apiErr.message ?? tCommon('errors.unknown'));
    },
  });

  if (sent) {
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
            {t('success.backToLogin')}
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

          {apiError && (
            <p className="text-sm text-destructive" role="alert">
              {apiError}
            </p>
          )}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? tCommon('submitting') : t('submit')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              {t('backToLogin')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
