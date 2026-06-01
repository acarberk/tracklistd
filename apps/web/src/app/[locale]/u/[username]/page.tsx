'use client';

import { useQuery } from '@tanstack/react-query';
import { GAME_STATUSES, type PublicProfileOutput } from '@tracklistd/shared';
import { User } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

import { GameCard } from '@/components/game-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicProfile, getPublicUserGames } from '@/lib/api/users';
import { extractApiError } from '@/lib/api-client';

export default function PublicProfilePage(): ReactNode {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';
  const t = useTranslations('publicProfile');

  const query = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => getPublicProfile(username),
    enabled: username.length > 0,
    retry: false,
  });

  if (query.isLoading) {
    return <PublicProfileSkeleton />;
  }

  if (query.isError) {
    const isNotFound = extractApiError(query.error).status === 404;
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isNotFound ? t('notFound.title') : t('errorTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isNotFound ? t('notFound.description') : t('error')}
        </p>
      </main>
    );
  }

  if (!query.data) {
    return null;
  }

  return <PublicProfileView profile={query.data} />;
}

function PublicProfileSkeleton(): ReactNode {
  return (
    <main className="container mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </main>
  );
}

function PublicProfileView({ profile }: { profile: PublicProfileOutput }): ReactNode {
  const t = useTranslations('publicProfile');
  const tStatus = useTranslations('addToLibrary.status');
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-muted">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
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
            <p className="text-xs text-muted-foreground">
              {t('memberSince')} {memberSince}
              {profile.country ? ` · ${profile.country}` : ''}
            </p>
          </div>
        </CardHeader>
        {profile.bio && (
          <CardContent>
            <p className="whitespace-pre-line text-sm">{profile.bio}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('stats.title')} · {t('stats.total', { count: profile.stats.total })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {GAME_STATUSES.map((status) => (
            <div
              key={status}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 p-3 text-center"
            >
              <span className="text-2xl font-bold">{profile.stats.byStatus[status]}</span>
              <span className="text-xs text-muted-foreground">{tStatus(status)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <TopGames username={profile.username} />
    </main>
  );
}

function TopGames({ username }: { username: string }): ReactNode {
  const t = useTranslations('publicProfile');
  const { data, isLoading } = useQuery({
    queryKey: ['publicUserGames', username],
    queryFn: () => getPublicUserGames(username),
  });
  const games = data?.items ?? [];

  if (isLoading) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t('topGames')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{t('topGames')}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {games.map((game) => (
          <GameCard
            key={game.slug}
            slug={game.slug}
            title={game.title}
            coverUrl={game.coverUrl ?? undefined}
            releaseDate={game.releaseDate ?? undefined}
            platforms={game.platforms}
            rating={game.rating}
          />
        ))}
      </div>
    </section>
  );
}
