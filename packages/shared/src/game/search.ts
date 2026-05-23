import { z } from 'zod';

export const gameSearchInputSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type GameSearchInput = z.infer<typeof gameSearchInputSchema>;

export const gameSearchResultSchema = z.object({
  igdbId: z.number().int().positive(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  coverUrl: z.url().optional(),
  releaseDate: z.iso.datetime().optional(),
  platforms: z.array(z.string()),
  genres: z.array(z.string()),
  igdbRating: z.number().optional(),
  igdbRatingCount: z.number().int().optional(),
});

export type GameSearchResult = z.infer<typeof gameSearchResultSchema>;

export const gameSearchOutputSchema = z.object({
  results: z.array(gameSearchResultSchema),
});

export type GameSearchOutput = z.infer<typeof gameSearchOutputSchema>;
