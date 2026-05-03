import { randomInt } from 'crypto';

const USERNAME_PATTERN = /[^a-z0-9_-]/g;
const MULTI_DASH = /-+/g;
const MULTI_UNDERSCORE = /_+/g;
const LEADING_TRAILING = /^[-_]+|[-_]+$/g;

const MIN_LENGTH = 3;
const MAX_LENGTH = 24;

export function sanitizeBaseUsername(input: string): string {
  const trimmed = input
    .toLowerCase()
    .replace(USERNAME_PATTERN, '-')
    .replace(MULTI_DASH, '-')
    .replace(MULTI_UNDERSCORE, '_')
    .replace(LEADING_TRAILING, '');

  if (trimmed.length === 0) {
    return 'user';
  }

  return trimmed.slice(0, MAX_LENGTH - 6);
}

export async function generateUniqueUsername(
  base: string,
  isAvailable: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const cleaned = sanitizeBaseUsername(base);

  if (cleaned.length >= MIN_LENGTH && (await isAvailable(cleaned))) {
    return cleaned;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = randomInt(1000, 100_000).toString();
    const candidate = `${cleaned}-${suffix}`.slice(0, MAX_LENGTH);
    if (await isAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not generate a unique username after 8 attempts');
}
