import { z } from 'zod';

import { emailSchema } from './common';

export const resendVerificationInputSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().min(1).optional(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationInputSchema>;
