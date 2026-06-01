import { Gamepad2, Star } from 'lucide-react';
import Image from 'next/image';
import { type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface GameCardProps {
  slug: string;
  title: string;
  coverUrl?: string;
  releaseDate?: string;
  platforms: string[];
  rating?: number | null;
  className?: string;
}

export function GameCard({
  slug,
  title,
  coverUrl,
  releaseDate,
  platforms,
  rating,
  className,
}: GameCardProps): ReactNode {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const topPlatforms = platforms.slice(0, 3);

  return (
    <Link
      href={`/games/${slug}`}
      className={cn(
        'group flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary',
        className,
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Gamepad2 className="h-12 w-12" />
          </div>
        )}
        {typeof rating === 'number' && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            <Star className="h-3 w-3 fill-current" />
            {rating}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 pb-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight">{title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{year ?? '—'}</span>
          {topPlatforms.length > 0 && (
            <span className="line-clamp-1">{topPlatforms.join(', ')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
