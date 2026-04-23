import { z } from 'zod';

const normalizeString = (val: unknown): unknown =>
  typeof val === 'string' ? val.trim().toLowerCase() : val;

const normalizeDisplayName = (val: unknown): unknown =>
  typeof val === 'string' ? val.trim() : val;

export const emailSchema = z.preprocess(
  normalizeString,
  z.email('Invalid email format').min(5, 'Email is too short').max(254, 'Email is too long'),
);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const usernameSchema = z.preprocess(
  normalizeString,
  z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[a-z0-9][a-z0-9_-]*$/, 'Username may contain letters, digits, underscore, or hyphen'),
);

export const displayNameSchema = z.preprocess(
  normalizeDisplayName,
  z.string().min(1, 'Display name cannot be empty').max(50, 'Display name is too long'),
);
