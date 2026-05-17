import { z } from 'zod';

import { emailSchema, passwordSchema } from './common';

export const forgotPasswordInputSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().min(1).optional(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(16),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
