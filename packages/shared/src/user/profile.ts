import { z } from 'zod';

import { displayNameSchema, emailSchema } from '../auth/common';

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
