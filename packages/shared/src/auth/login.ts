import { z } from 'zod';

import { emailSchema, passwordSchema } from './common';

export const loginInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  turnstileToken: z.string().min(1).optional(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: emailSchema,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.url().nullable(),
  emailVerified: z.boolean(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const loginOutputSchema = z.object({
  accessToken: z.string(),
  user: publicUserSchema,
});

export type LoginOutput = z.infer<typeof loginOutputSchema>;
