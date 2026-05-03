const MS_BY_UNIT: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  const multiplier = MS_BY_UNIT[unit];
  if (multiplier === undefined) {
    throw new Error(`Unknown duration unit: ${unit}`);
  }
  return amount * multiplier;
}

export function jitterDelay(minMs: number, spreadMs: number): Promise<void> {
  const ms = minMs + Math.floor(Math.random() * spreadMs);
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
