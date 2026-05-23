'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GAME_STATUSES, type GameStatus } from '@tracklistd/shared';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addUserGame } from '@/lib/api/user-games';
import { extractApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface AddToLibraryDialogProps {
  igdbId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

export function AddToLibraryDialog({
  igdbId,
  open,
  onOpenChange,
  onAdded,
}: AddToLibraryDialogProps): ReactNode {
  const t = useTranslations('addToLibrary');
  const tStatus = useTranslations('addToLibrary.status');
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<GameStatus>('WANT_TO_PLAY');
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      addUserGame({
        igdbId,
        status,
        rating: rating ?? undefined,
        review: review.trim() || undefined,
      }),
    onSuccess: () => {
      setApiError(null);
      void queryClient.invalidateQueries({ queryKey: ['library'] });
      onAdded?.();
      onOpenChange(false);
    },
    onError: (error) => {
      const err = extractApiError(error);
      if (err.code === 'USER_GAME_ALREADY_EXISTS') {
        setApiError(t('errors.alreadyExists'));
      } else {
        setApiError(t('errors.unknown'));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">{t('statusLabel')}</Label>
            <Select
              id="status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as GameStatus);
              }}
              disabled={mutation.isPending}
            >
              {GAME_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {tStatus(value)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('ratingLabel')}</Label>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${String(value)} / 10`}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs transition-colors hover:bg-accent',
                    rating !== null && rating >= value && 'bg-primary text-primary-foreground',
                  )}
                  onClick={() => {
                    setRating((current) => (current === value ? null : value));
                  }}
                  disabled={mutation.isPending}
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              ))}
              {rating !== null && (
                <span className="ml-2 self-center text-xs text-muted-foreground">
                  {rating} / 10
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review">{t('reviewLabel')}</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(event) => {
                setReview(event.target.value);
              }}
              placeholder={t('reviewPlaceholder')}
              rows={4}
              maxLength={10_000}
              disabled={mutation.isPending}
            />
          </div>

          {apiError && (
            <p className="text-sm text-destructive" role="alert">
              {apiError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
              }}
              disabled={mutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
