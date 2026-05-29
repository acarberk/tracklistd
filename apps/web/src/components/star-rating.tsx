'use client';

import { Star } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  max?: number;
}

export function StarRating({
  value,
  onChange,
  disabled = false,
  max = 10,
}: StarRatingProps): ReactNode {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${String(star)} / ${String(max)}`}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs transition-colors hover:bg-accent',
            value !== null && value >= star && 'bg-primary text-primary-foreground',
          )}
          onClick={() => {
            onChange(value === star ? null : star);
          }}
          disabled={disabled}
        >
          <Star className="h-3.5 w-3.5" />
        </button>
      ))}
      {value !== null && (
        <span className="ml-2 self-center text-xs text-muted-foreground">
          {value} / {max}
        </span>
      )}
    </div>
  );
}
