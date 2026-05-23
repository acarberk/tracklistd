import { isAxiosError } from 'axios';
import { Calendar, Gamepad2, Star } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type ReactNode } from 'react';

import type { Metadata } from 'next';

import { AddToLibraryButton } from '@/components/add-to-library-button';
import { getGameBySlug } from '@/lib/api/games';

interface GameDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: GameDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const game = await getGameBySlug(slug);
    return {
      title: game.title,
      description: game.summary ?? undefined,
      openGraph: game.coverUrl ? { images: [game.coverUrl] } : undefined,
    };
  } catch {
    return { title: slug };
  }
}

export default async function GameDetailPage({ params }: GameDetailPageProps): Promise<ReactNode> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gameDetail');

  let game;
  try {
    game = await getGameBySlug(slug);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  const releaseDate = game.releaseDate ? new Date(game.releaseDate) : null;
  const formattedRelease = releaseDate?.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="relative aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-lg border border-border bg-muted">
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 260px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Gamepad2 className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{game.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {formattedRelease && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formattedRelease}
                </span>
              )}
              {typeof game.igdbRating === 'number' && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  {game.igdbRating.toFixed(1)} / 100
                  {typeof game.igdbRatingCount === 'number' && (
                    <span className="text-xs">({game.igdbRatingCount.toLocaleString(locale)})</span>
                  )}
                </span>
              )}
            </div>
          </header>

          <div className="flex flex-wrap gap-2">
            {game.platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs"
              >
                {platform}
              </span>
            ))}
            {game.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {genre}
              </span>
            ))}
          </div>

          <AddToLibraryButton igdbId={game.igdbId} />

          {game.summary && (
            <section className="flex flex-col gap-2 pt-2">
              <h2 className="text-lg font-semibold">{t('summary')}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {game.summary}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
