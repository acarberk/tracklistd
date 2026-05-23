'use client';

import { Check, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { AddToLibraryDialog } from '@/components/add-to-library-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface AddToLibraryButtonProps {
  igdbId: number;
}

export function AddToLibraryButton({ igdbId }: AddToLibraryButtonProps): ReactNode {
  const t = useTranslations('addToLibrary');
  const tGameDetail = useTranslations('gameDetail');
  const { isAuthenticated, isLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <Button size="lg" disabled className="w-fit">
        {tGameDetail('addToLibrary')}
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'w-fit')}>
        {t('signInToAdd')}
      </Link>
    );
  }

  if (added) {
    return (
      <Button size="lg" variant="secondary" disabled className="w-fit">
        <Check className="h-4 w-4" />
        {t('inLibrary')}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-fit"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        {tGameDetail('addToLibrary')}
      </Button>
      <AddToLibraryDialog
        igdbId={igdbId}
        open={open}
        onOpenChange={setOpen}
        onAdded={() => {
          setAdded(true);
        }}
      />
    </>
  );
}
