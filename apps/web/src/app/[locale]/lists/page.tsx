'use client';

import { useQuery } from '@tanstack/react-query';
import { MAX_LISTS_PER_USER } from '@tracklistd/shared';
import { ListPlus, Lock, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { CreateListDialog } from '@/components/create-list-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { getLists } from '@/lib/api/lists';
import { cn } from '@/lib/utils';

export default function ListsPage(): ReactNode {
  const t = useTranslations('lists');
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const [creating, setCreating] = useState(false);

  const query = useQuery({ queryKey: ['lists'], queryFn: getLists, enabled: isAuthenticated });

  if (authLoading || (isAuthenticated && query.isLoading)) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      </main>
    );
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

  const lists = query.data?.items ?? [];
  const atLimit = lists.length >= MAX_LISTS_PER_USER;

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('count', { count: lists.length, max: MAX_LISTS_PER_USER })}
          </p>
        </div>
        <Button
          disabled={atLimit}
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ListPlus className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
            <Button
              onClick={() => {
                setCreating(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {list.name}
                    {!list.isPublic && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {list.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t('gameCount', { count: list.itemCount })}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateListDialog open={creating} onOpenChange={setCreating} />
    </main>
  );
}
