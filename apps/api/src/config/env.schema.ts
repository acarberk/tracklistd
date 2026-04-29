import { z } from 'zod';

const durationPattern = /^\d+(ms|s|m|h|d)$/;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z
    .string()
    .regex(durationPattern, 'JWT_ACCESS_TTL must look like 15m or 1h')
    .default('15m'),
  JWT_REFRESH_TTL: z
    .string()
    .regex(durationPattern, 'JWT_REFRESH_TTL must look like 7d')
    .default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
