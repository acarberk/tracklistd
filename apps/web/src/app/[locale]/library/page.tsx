'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { GAME_STATUSES, type GameStatus, type ListUserGamesQuery } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { LibraryCard } from '@/components/library-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { listUserGames } from '@/lib/api/user-games';
import { cn } from '@/lib/utils';

type FilterTab = 'ALL' | GameStatus;
const FILTER_TABS: FilterTab[] = ['ALL', ...GAME_STATUSES];

export default function LibraryPage(): ReactNode {
  const t = useTranslations('library');
  const tStatus = useTranslations('addToLibrary.status');
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const query = useInfiniteQuery({
    queryKey: ['library', activeTab],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const params: ListUserGamesQuery = { limit: 24 };
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (pageParam) {
        params.cursor = pageParam;
      }
      return listUserGames(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });

  if (isAuthLoading) {
    return <LibraryLoading />;
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

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-col gap-4 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <nav className="flex flex-wrap gap-2" aria-label={t('filterLabel')}>
          {FILTER_TABS.map((tab) => {
            const label = tab === 'ALL' ? t('tabs.all') : tStatus(tab);
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                }}
                className={cn(
                  'rounded-full border border-border px-3 py-1 text-xs transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent',
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      {query.isLoading && <LibraryGridSkeleton />}

      {!query.isLoading && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <p>{t('empty')}</p>
          <Link href="/discover" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            {t('discoverGames')}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((entry) => (
            <LibraryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {query.hasNextPage && (
        <div className="flex justify-center pt-8">
          <Button
            variant="outline"
            onClick={() => {
              void query.fetchNextPage();
            }}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? t('loading') : t('loadMore')}
          </Button>
        </div>
      )}
    </main>
  );
}

function LibraryLoading(): ReactNode {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6">
        <LibraryGridSkeleton />
      </div>
    </main>
  );
}

function LibraryGridSkeleton(): ReactNode {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="aspect-[3/4] w-full" />
      ))}
    </div>
  );
}
