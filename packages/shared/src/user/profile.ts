import { z } from 'zod';

import { displayNameSchema, emailSchema } from '../auth/common';
import { gameStatusSchema } from '../game/user-game';

export const userProfileOutputSchema = z.object({
  id: z.uuid(),
  email: emailSchema,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.url().nullable(),
  bio: z.string().nullable(),
  country: z.string().length(2).nullable(),
  emailVerified: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type UserProfileOutput = z.infer<typeof userProfileOutputSchema>;

const bioSchema = z.string().max(500);
const countrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'Country must be an ISO 3166-1 alpha-2 code');
const avatarUrlSchema = z.url().max(2000);

export const updateProfileInputSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema.nullable().optional(),
  country: countrySchema.nullable().optional(),
  avatarUrl: avatarUrlSchema.nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const publicProfileStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.record(gameStatusSchema, z.number().int().nonnegative()),
});

export const publicProfileOutputSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.url().nullable(),
  bio: z.string().nullable(),
  country: z.string().length(2).nullable(),
  createdAt: z.iso.datetime(),
  stats: publicProfileStatsSchema,
});

export type PublicProfileOutput = z.infer<typeof publicProfileOutputSchema>;

export const publicUserGameSchema = z.object({
  slug: z.string(),
  title: z.string(),
  coverUrl: z.url().nullable(),
  releaseDate: z.iso.datetime().nullable(),
  platforms: z.array(z.string()),
  status: gameStatusSchema,
  rating: z.number().int().nullable(),
});

export type PublicUserGame = z.infer<typeof publicUserGameSchema>;

export const publicUserGamesOutputSchema = z.object({
  items: z.array(publicUserGameSchema),
});

export type PublicUserGamesOutput = z.infer<typeof publicUserGamesOutputSchema>;

export const statBucketSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
});

export const userStatsOutputSchema = z.object({
  totalGames: z.number().int().nonnegative(),
  totalHours: z.number().int().nonnegative(),
  averageRating: z.number().nullable(),
  byStatus: z.record(gameStatusSchema, z.number().int().nonnegative()),
  topGenres: z.array(statBucketSchema),
  topPlatforms: z.array(statBucketSchema),
});

export type UserStatsOutput = z.infer<typeof userStatsOutputSchema>;
