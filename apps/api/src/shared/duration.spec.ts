import { jitterDelay, parseDurationMs } from './duration';

describe('parseDurationMs', () => {
  it.each([
    ['100ms', 100],
    ['1s', 1_000],
    ['30s', 30_000],
    ['15m', 15 * 60 * 1_000],
    ['1h', 60 * 60 * 1_000],
    ['7d', 7 * 24 * 60 * 60 * 1_000],
  ])('parses %s as %d ms', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it.each(['', '15', 'abc', '15x', '-5m', '1.5h', '15ms 30s'])(
    'throws on invalid input: %s',
    (input) => {
      expect(() => parseDurationMs(input)).toThrow(/Invalid duration/);
    },
  );
});

describe('jitterDelay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves after at least minMs', async () => {
    const promise = jitterDelay(100, 50);
    let resolved = false;
    void promise.then(() => {
      resolved = true;
    });

    await jest.advanceTimersByTimeAsync(99);
    expect(resolved).toBe(false);

    await jest.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(true);
  });

  it('resolves before minMs + spreadMs at the latest', async () => {
    const promise = jitterDelay(100, 50);
    await jest.advanceTimersByTimeAsync(150);
    await expect(promise).resolves.toBeUndefined();
  });
});
