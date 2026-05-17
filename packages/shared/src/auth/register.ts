import { z } from 'zod';

import { displayNameSchema, emailSchema, passwordSchema, usernameSchema } from './common';

export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  displayName: displayNameSchema,
  turnstileToken: z.string().min(1, 'CAPTCHA token is required').max(2048).optional(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const registerOutputSchema = z.object({
  userId: z.uuid(),
  email: emailSchema,
});

export type RegisterOutput = z.infer<typeof registerOutputSchema>;
