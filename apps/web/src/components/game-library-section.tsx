'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Pencil, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { AddToLibraryButton } from '@/components/add-to-library-button';
import { EditLibraryDialog } from '@/components/edit-library-dialog';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { getUserGameByIgdb } from '@/lib/api/user-games';

interface GameLibrarySectionProps {
  igdbId: number;
}

export function GameLibrarySection({ igdbId }: GameLibrarySectionProps): ReactNode {
  const tGameDetail = useTranslations('gameDetail');
  const tAdd = useTranslations('addToLibrary');
  const tStatus = useTranslations('addToLibrary.status');
  const tLibrary = useTranslations('library');
  const { isAuthenticated } = useUser();
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: ['userGame', 'byIgdb', igdbId],
    queryFn: () => getUserGameByIgdb(igdbId),
    enabled: isAuthenticated,
  });

  if (isAuthenticated && query.isLoading) {
    return (
      <Button size="lg" disabled className="w-fit">
        {tGameDetail('addToLibrary')}
      </Button>
    );
  }

  const entry = isAuthenticated ? query.data : null;

  if (!entry) {
    return <AddToLibraryButton igdbId={igdbId} />;
  }

  return (
    <div className="flex w-fit flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Check className="h-4 w-4 text-primary" />
        {tAdd('inLibrary')}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
          {tStatus(entry.status)}
        </span>
        {entry.rating !== null && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            {entry.rating} / 10
          </span>
        )}
      </div>

      {entry.review && (
        <p className="max-w-prose whitespace-pre-line text-sm italic text-muted-foreground">
          {entry.review}
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => {
          setEditing(true);
        }}
      >
        <Pencil className="h-4 w-4" />
        {tLibrary('edit')}
      </Button>

      <EditLibraryDialog entry={entry} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
