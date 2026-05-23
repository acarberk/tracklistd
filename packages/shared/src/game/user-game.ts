import { z } from 'zod';

export const GAME_STATUSES = [
  'WANT_TO_PLAY',
  'PLAYING',
  'COMPLETED',
  'DROPPED',
  'ON_HOLD',
] as const;

export const gameStatusSchema = z.enum(GAME_STATUSES);

export type GameStatus = z.infer<typeof gameStatusSchema>;

const ratingSchema = z.number().int().min(1).max(10);
const reviewSchema = z.string().max(10_000);
const hoursPlayedSchema = z.number().int().min(0).max(100_000);

export const addUserGameInputSchema = z.object({
  igdbId: z.number().int().positive(),
  status: gameStatusSchema.optional().default('WANT_TO_PLAY'),
  rating: ratingSchema.optional(),
  review: reviewSchema.optional(),
  startedAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().optional(),
  hoursPlayed: hoursPlayedSchema.optional(),
});

export type AddUserGameInput = z.infer<typeof addUserGameInputSchema>;

export const updateUserGameInputSchema = z.object({
  status: gameStatusSchema.optional(),
  rating: ratingSchema.nullable().optional(),
  review: reviewSchema.nullable().optional(),
  startedAt: z.iso.datetime().nullable().optional(),
  completedAt: z.iso.datetime().nullable().optional(),
  hoursPlayed: hoursPlayedSchema.nullable().optional(),
});

export type UpdateUserGameInput = z.infer<typeof updateUserGameInputSchema>;

export const listUserGamesQuerySchema = z.object({
  status: gameStatusSchema.optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListUserGamesQuery = z.infer<typeof listUserGamesQuerySchema>;

export const userGameSchema = z.object({
  id: z.uuid(),
  status: gameStatusSchema,
  rating: z.number().int().nullable(),
  review: z.string().nullable(),
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  hoursPlayed: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  game: z.object({
    id: z.uuid(),
    igdbId: z.number().int(),
    slug: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    coverUrl: z.url().nullable(),
    releaseDate: z.iso.datetime().nullable(),
    platforms: z.array(z.string()),
    genres: z.array(z.string()),
  }),
});

export type UserGameOutput = z.infer<typeof userGameSchema>;

export const listUserGamesOutputSchema = z.object({
  items: z.array(userGameSchema),
  nextCursor: z.uuid().nullable(),
});

export type ListUserGamesOutput = z.infer<typeof listUserGamesOutputSchema>;
