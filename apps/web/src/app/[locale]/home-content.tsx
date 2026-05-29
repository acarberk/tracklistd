'use client';

import { useQuery } from '@tanstack/react-query';
import { Compass, Library, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

import { GameCard } from '@/components/game-card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { popularGames } from '@/lib/api/games';
import { cn } from '@/lib/utils';

const POPULAR_LIMIT = 12;
const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';

export function HomeContent(): ReactNode {
  const t = useTranslations('home');
  const tSite = useTranslations('site');
  const { isAuthenticated, user } = useUser();

  const { data, isFetching, isError } = useQuery({
    queryKey: ['games', 'popular'],
    queryFn: () => popularGames(POPULAR_LIMIT),
    staleTime: 10 * 60 * 1000,
  });
  const games = data?.results ?? [];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      {isAuthenticated && user ? (
        <section className="flex flex-col gap-4 pb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('welcome', { name: user.displayName })}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/discover" className={cn(buttonVariants())}>
              <Compass className="h-4 w-4" />
              {t('quick.discover')}
            </Link>
            <Link href="/library" className={cn(buttonVariants({ variant: 'outline' }))}>
              <Library className="h-4 w-4" />
              {t('quick.library')}
            </Link>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-5 pb-12 pt-6 text-center">
          <Sparkles className="h-10 w-10 text-primary" />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight">{tSite('name')}</h1>
            <p className="max-w-xl text-muted-foreground">{tSite('tagline')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }))}>
              {t('hero.getStarted')}
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              {t('hero.signIn')}
            </Link>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{t('popular.title')}</h2>
        {isError && (
          <p className="py-8 text-center text-sm text-destructive">{t('popular.error')}</p>
        )}
        {!isError && (
          <div className={GRID}>
            {isFetching && games.length === 0
              ? Array.from({ length: POPULAR_LIMIT }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[3/4] w-full" />
                ))
              : games.map((game) => (
                  <GameCard
                    key={game.igdbId}
                    slug={game.slug}
                    title={game.title}
                    coverUrl={game.coverUrl}
                    releaseDate={game.releaseDate}
                    platforms={game.platforms}
                  />
                ))}
          </div>
        )}
      </section>
    </main>
  );
}
