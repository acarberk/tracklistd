import { z } from 'zod';

import { emailSchema } from './common';

export const resendVerificationInputSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationInputSchema>;
