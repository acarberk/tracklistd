'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GAME_STATUSES, type GameStatus, type UserGameOutput } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { StarRating } from '@/components/star-rating';
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
import { updateUserGame } from '@/lib/api/user-games';
import { extractApiError } from '@/lib/api-client';

interface EditLibraryDialogProps {
  entry: UserGameOutput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLibraryDialog({
  entry,
  open,
  onOpenChange,
}: EditLibraryDialogProps): ReactNode {
  const t = useTranslations('library');
  const tAdd = useTranslations('addToLibrary');
  const tStatus = useTranslations('addToLibrary.status');
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<GameStatus>(entry.status);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [review, setReview] = useState(entry.review ?? '');
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateUserGame(entry.id, {
        status,
        rating,
        review: review.trim() ? review.trim() : null,
      }),
    onSuccess: () => {
      setApiError(null);
      void queryClient.invalidateQueries({ queryKey: ['library'] });
      void queryClient.invalidateQueries({ queryKey: ['userGame'] });
      onOpenChange(false);
    },
    onError: (error) => {
      setApiError(extractApiError(error).message ?? t('updateError'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editEntry')}</DialogTitle>
          <DialogDescription>{entry.game.title}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-status">{tAdd('statusLabel')}</Label>
            <Select
              id="edit-status"
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
            <Label>{tAdd('ratingLabel')}</Label>
            <StarRating value={rating} onChange={setRating} disabled={mutation.isPending} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-review">{tAdd('reviewLabel')}</Label>
            <Textarea
              id="edit-review"
              value={review}
              onChange={(event) => {
                setReview(event.target.value);
              }}
              placeholder={tAdd('reviewPlaceholder')}
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
              {tAdd('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
