'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type GameListDetail } from '@tracklistd/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createList, updateList } from '@/lib/api/lists';
import { extractApiError } from '@/lib/api-client';

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: GameListDetail;
  onSaved?: (list: GameListDetail) => void;
}

export function CreateListDialog({
  open,
  onOpenChange,
  list,
  onSaved,
}: CreateListDialogProps): ReactNode {
  const t = useTranslations('lists');
  const tCommon = useTranslations('auth.common');
  const queryClient = useQueryClient();
  const isEdit = list !== undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(list?.name ?? '');
      setDescription(list?.description ?? '');
      setIsPublic(list?.isPublic ?? true);
      setApiError(null);
    }
  }, [open, list]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        isPublic,
      };
      return isEdit ? updateList(list.id, payload) : createList(payload);
    },
    onSuccess: (saved) => {
      setApiError(null);
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
      void queryClient.invalidateQueries({ queryKey: ['list', saved.id] });
      onSaved?.(saved);
      onOpenChange(false);
    },
    onError: (error) => {
      const err = extractApiError(error);
      setApiError(
        err.code === 'LIST_LIMIT_REACHED' ? t('errors.limitReached') : tCommon('errors.unknown'),
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length === 0) {
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="list-name">{t('nameLabel')}</Label>
            <Input
              id="list-name"
              value={name}
              maxLength={100}
              placeholder={t('namePlaceholder')}
              onChange={(event) => {
                setName(event.target.value);
              }}
              disabled={mutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="list-description">{t('descriptionLabel')}</Label>
            <Textarea
              id="list-description"
              value={description}
              rows={3}
              maxLength={1000}
              placeholder={t('descriptionPlaceholder')}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              disabled={mutation.isPending}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => {
                setIsPublic(event.target.checked);
              }}
              disabled={mutation.isPending}
              className="h-4 w-4 rounded border-border"
            />
            {t('publicLabel')}
          </label>

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
            <Button type="submit" disabled={mutation.isPending || name.trim().length === 0}>
              {mutation.isPending ? tCommon('submitting') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
