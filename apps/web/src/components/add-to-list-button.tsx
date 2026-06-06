'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListPlus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { addListItem, getLists } from '@/lib/api/lists';
import { extractApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function AddToListButton({ igdbId }: { igdbId: number }): ReactNode {
  const t = useTranslations('lists');
  const { isAuthenticated } = useUser();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['lists'], queryFn: getLists, enabled: open });

  const mutation = useMutation({
    mutationFn: (listId: string) => addListItem(listId, igdbId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['list', updated.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success(t('addedToList', { name: updated.name }));
      setOpen(false);
    },
    onError: (error) => {
      const err = extractApiError(error);
      toast.error(err.code === 'LIST_ITEM_EXISTS' ? t('errors.itemExists') : t('errors.addFailed'));
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const lists = query.data?.items ?? [];

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="w-fit"
        onClick={() => {
          setOpen(true);
        }}
      >
        <ListPlus className="h-4 w-4" />
        {t('addToList')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addToListTitle')}</DialogTitle>
          </DialogHeader>

          {query.isLoading ? (
            <p className="py-4 text-sm text-muted-foreground">{t('loading')}</p>
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('noListsYet')}</p>
              <Link
                href="/lists"
                className={cn(buttonVariants())}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {t('manageLists')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary disabled:opacity-50"
                  onClick={() => {
                    mutation.mutate(list.id);
                  }}
                  disabled={mutation.isPending}
                >
                  <span>{list.name}</span>
                  <Plus className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
