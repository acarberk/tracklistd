'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GAME_STATUSES, type GameStatus, type UserGameOutput } from '@tracklistd/shared';
import { Gamepad2, Pencil, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { EditLibraryDialog } from '@/components/edit-library-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Link } from '@/i18n/navigation';
import { deleteUserGame, updateUserGame } from '@/lib/api/user-games';
import { cn } from '@/lib/utils';

interface LibraryCardProps {
  entry: UserGameOutput;
}

export function LibraryCard({ entry }: LibraryCardProps): ReactNode {
  const t = useTranslations('library');
  const tStatus = useTranslations('addToLibrary.status');
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (status: GameStatus) => updateUserGame(entry.id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUserGame(entry.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const isBusy = updateMutation.isPending || deleteMutation.isPending;
  const releaseYear = entry.game.releaseDate
    ? new Date(entry.game.releaseDate).getFullYear()
    : null;

  return (
    <div className="group flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card">
      <Link
        href={`/games/${entry.game.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-muted"
      >
        {entry.game.coverUrl ? (
          <Image
            src={entry.game.coverUrl}
            alt={entry.game.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Gamepad2 className="h-12 w-12" />
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-2 px-3 pb-3">
        <Link href={`/games/${entry.game.slug}`} className="hover:underline">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">{entry.game.title}</h3>
        </Link>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{releaseYear ?? '—'}</span>
          {entry.rating !== null && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {entry.rating}
            </span>
          )}
        </div>

        {entry.review && (
          <p className="line-clamp-2 text-xs italic text-muted-foreground">{entry.review}</p>
        )}

        <Select
          value={entry.status}
          onChange={(event) => {
            updateMutation.mutate(event.target.value as GameStatus);
          }}
          disabled={isBusy}
          className="h-8 text-xs"
        >
          {GAME_STATUSES.map((value) => (
            <option key={value} value={value}>
              {tStatus(value)}
            </option>
          ))}
        </Select>

        <button
          type="button"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'h-8 justify-start text-xs',
          )}
          onClick={() => {
            setEditing(true);
          }}
          disabled={isBusy}
        >
          <Pencil className="h-3 w-3" />
          {t('edit')}
        </button>

        {confirmingDelete ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs"
              onClick={() => {
                deleteMutation.mutate();
              }}
              disabled={isBusy}
            >
              {t('confirmDelete')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => {
                setConfirmingDelete(false);
              }}
              disabled={isBusy}
            >
              {t('cancelDelete')}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 justify-start text-xs text-muted-foreground hover:text-destructive',
            )}
            onClick={() => {
              setConfirmingDelete(true);
            }}
            disabled={isBusy}
          >
            <Trash2 className="h-3 w-3" />
            {t('remove')}
          </button>
        )}
      </div>

      <EditLibraryDialog entry={entry} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
