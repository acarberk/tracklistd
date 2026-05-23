'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { GameCard } from '@/components/game-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { searchGames } from '@/lib/api/games';

const DEBOUNCE_MS = 300;
const SKELETON_COUNT = 10;

export default function DiscoverPage(): ReactNode {
  const t = useTranslations('discover');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['games', 'search', debouncedQuery],
    queryFn: () => searchGames(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const results = data?.results ?? [];
  const showEmpty = debouncedQuery.length === 0;
  const showNoResults = !showEmpty && !isFetching && !isError && results.length === 0;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-col gap-3 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
            autoFocus
          />
        </div>
      </header>

      {showEmpty && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Search className="h-10 w-10 opacity-40" />
          <p>{t('emptyHint')}</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-destructive">
          <p>{t('error')}</p>
        </div>
      )}

      {isFetching && !showEmpty && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      )}

      {showNoResults && (
        <div className="py-16 text-center text-muted-foreground">
          <p>{t('noResults', { query: debouncedQuery })}</p>
        </div>
      )}

      {!isFetching && !isError && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((game) => (
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
    </main>
  );
}
