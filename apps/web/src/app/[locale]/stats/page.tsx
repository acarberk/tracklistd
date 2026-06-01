'use client';

import { useQuery } from '@tanstack/react-query';
import { GAME_STATUSES, type GameStatus } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { getMyStats } from '@/lib/api/users';
import { cn } from '@/lib/utils';

export default function StatsPage(): ReactNode {
  const t = useTranslations('stats');
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const query = useQuery({ queryKey: ['stats'], queryFn: getMyStats, enabled: isAuthenticated });

  if (authLoading || (isAuthenticated && query.isLoading)) {
    return <StatsSkeleton />;
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

  const stats = query.data;

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

      {stats.totalGames === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
            <Link href="/discover" className={cn(buttonVariants())}>
              {t('discover')}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard label={t('totalGames')} value={String(stats.totalGames)} />
            <SummaryCard label={t('totalHours')} value={String(stats.totalHours)} />
            <SummaryCard
              label={t('averageRating')}
              value={stats.averageRating !== null ? String(stats.averageRating) : '—'}
            />
          </div>

          <StatusBreakdown byStatus={stats.byStatus} />

          {stats.topGenres.length > 0 && (
            <BucketCard title={t('topGenres')} buckets={stats.topGenres} />
          )}
          {stats.topPlatforms.length > 0 && (
            <BucketCard title={t('topPlatforms')} buckets={stats.topPlatforms} />
          )}
        </>
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function StatusBreakdown({ byStatus }: { byStatus: Record<GameStatus, number> }): ReactNode {
  const t = useTranslations('stats');
  const tStatus = useTranslations('addToLibrary.status');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('byStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {GAME_STATUSES.map((status) => (
          <div
            key={status}
            className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 p-3 text-center"
          >
            <span className="text-2xl font-bold">{byStatus[status]}</span>
            <span className="text-xs text-muted-foreground">{tStatus(status)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BucketCard({
  title,
  buckets,
}: {
  title: string;
  buckets: { name: string; count: number }[];
}): ReactNode {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {buckets.map((bucket) => (
          <div key={bucket.name} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 truncate text-muted-foreground">{bucket.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${String(Math.round((bucket.count / max) * 100))}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right tabular-nums">{bucket.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton(): ReactNode {
  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </main>
  );
}
