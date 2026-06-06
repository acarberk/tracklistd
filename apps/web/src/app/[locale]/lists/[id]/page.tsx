'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Pencil, Trash2, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { CreateListDialog } from '@/components/create-list-dialog';
import { GameCard } from '@/components/game-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { Link, useRouter } from '@/i18n/navigation';
import { deleteList, getList, removeListItem } from '@/lib/api/lists';
import { extractApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function ListDetailPage(): ReactNode {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const t = useTranslations('lists');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const query = useQuery({
    queryKey: ['list', id],
    queryFn: () => getList(id),
    enabled: isAuthenticated && id.length > 0,
    retry: false,
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeListItem(id, itemId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['list', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteList(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
      router.push('/lists');
    },
  });

  if (authLoading || (isAuthenticated && query.isLoading)) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('signInRequired.title')}</h1>
        <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'mt-6 inline-flex')}>
          {t('signInRequired.cta')}
        </Link>
      </main>
    );
  }

  if (query.isError) {
    const isNotFound = extractApiError(query.error).status === 404;
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isNotFound ? t('notFound.title') : t('errors.loadTitle')}
        </h1>
        <Link
          href="/lists"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 inline-flex')}
        >
          {t('backToLists')}
        </Link>
      </main>
    );
  }

  if (!query.data) {
    return null;
  }

  const list = query.data;

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/lists"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t('backToLists')}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {list.name}
              {!list.isPublic && <Lock className="h-4 w-4 text-muted-foreground" />}
            </h1>
            {list.description && (
              <p className="text-sm text-muted-foreground">{list.description}</p>
            )}
            <span className="text-xs text-muted-foreground">
              {t('gameCount', { count: list.itemCount })}
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              {t('editAction')}
            </Button>
            {confirmingDelete ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteMutation.mutate();
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {t('confirmDelete')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirmingDelete(false);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {t('cancel')}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setConfirmingDelete(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t('deleteAction')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {list.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t('emptyItems')}</p>
            <Link href="/discover" className={cn(buttonVariants())}>
              {t('discoverGames')}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {list.items.map((item) => (
            <div key={item.id} className="relative">
              <GameCard
                slug={item.game.slug}
                title={item.game.title}
                coverUrl={item.game.coverUrl ?? undefined}
                releaseDate={item.game.releaseDate ?? undefined}
                platforms={item.game.platforms}
              />
              <button
                type="button"
                aria-label={t('removeItem')}
                className="absolute left-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white transition-colors hover:bg-destructive"
                onClick={(event) => {
                  event.preventDefault();
                  removeItemMutation.mutate(item.id);
                }}
                disabled={removeItemMutation.isPending}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateListDialog open={editing} onOpenChange={setEditing} list={list} />
    </main>
  );
}
