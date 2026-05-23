'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  updateProfileInputSchema,
  type UpdateProfileInput,
  type UserProfileOutput,
} from '@tracklistd/shared';
import { Pencil, User } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { getProfile, updateProfile } from '@/lib/api/auth';
import { extractApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage(): ReactNode {
  const t = useTranslations('profile');
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
  });

  if (isAuthLoading || (isAuthenticated && query.isLoading)) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('signInRequired.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('signInRequired.description')}</p>
        <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'mt-6 inline-flex')}>
          {t('signInRequired.cta')}
        </Link>
      </main>
    );
  }

  if (!query.data) {
    return null;
  }

  if (editing) {
    return (
      <ProfileEditForm
        profile={query.data}
        onCancel={() => {
          setEditing(false);
        }}
        onSaved={() => {
          setEditing(false);
        }}
      />
    );
  }

  return (
    <ProfileView
      profile={query.data}
      onEdit={() => {
        setEditing(true);
      }}
    />
  );
}

function ProfileSkeleton(): ReactNode {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Skeleton className="mb-4 h-32 w-32 rounded-full" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </main>
  );
}

function ProfileView({
  profile,
  onEdit,
}: {
  profile: UserProfileOutput;
  onEdit: () => void;
}): ReactNode {
  const t = useTranslations('profile');
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-muted">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <User className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <CardTitle>{profile.displayName}</CardTitle>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {t('edit')}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label={t('email')} value={profile.email} />
          {profile.bio && <Row label={t('bio')} value={profile.bio} multiline />}
          {profile.country && <Row label={t('country')} value={profile.country} />}
          <Row label={t('memberSince')} value={memberSince} />
        </CardContent>
      </Card>
    </main>
  );
}

function Row({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('text-sm', multiline && 'whitespace-pre-line')}>{value}</span>
    </div>
  );
}

function ProfileEditForm({
  profile,
  onCancel,
  onSaved,
}: {
  profile: UserProfileOutput;
  onCancel: () => void;
  onSaved: () => void;
}): ReactNode {
  const t = useTranslations('profile');
  const tCommon = useTranslations('auth.common');
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(updateProfileInputSchema),
    defaultValues: {
      displayName: profile.displayName,
      bio: profile.bio ?? '',
      country: profile.country ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    } as UpdateProfileInput,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => updateProfile(data),
    onSuccess: (updated) => {
      setApiError(null);
      queryClient.setQueryData(['profile'], updated);
      const store = useAuthStore.getState();
      if (store.user) {
        store.setSession(store.accessToken ?? '', {
          ...store.user,
          displayName: updated.displayName,
          avatarUrl: updated.avatarUrl,
        });
      }
      onSaved();
    },
    onError: (error) => {
      const err = extractApiError(error);
      setApiError(err.message ?? tCommon('errors.unknown'));
    },
  });

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              void form.handleSubmit((data) => {
                const cleaned: UpdateProfileInput = {
                  displayName: data.displayName,
                  bio: data.bio?.trim() ? data.bio.trim() : null,
                  country: data.country?.trim() ? data.country.trim().toUpperCase() : null,
                  avatarUrl: data.avatarUrl?.trim() ? data.avatarUrl.trim() : null,
                };
                mutation.mutate(cleaned);
              })(event);
            }}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">{t('displayName')}</Label>
              <Input
                id="displayName"
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
              <Label htmlFor="bio">{t('bio')}</Label>
              <Textarea
                id="bio"
                rows={3}
                maxLength={500}
                placeholder={t('bioPlaceholder')}
                disabled={mutation.isPending}
                {...form.register('bio')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="country">{t('country')}</Label>
              <Input
                id="country"
                placeholder="TR"
                maxLength={2}
                disabled={mutation.isPending}
                {...form.register('country')}
              />
              {form.formState.errors.country && (
                <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="avatarUrl">{t('avatarUrl')}</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://..."
                disabled={mutation.isPending}
                {...form.register('avatarUrl')}
              />
              {form.formState.errors.avatarUrl && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.avatarUrl.message}
                </p>
              )}
            </div>

            {apiError && (
              <p className="text-sm text-destructive" role="alert">
                {apiError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={mutation.isPending}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? tCommon('submitting') : t('save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
