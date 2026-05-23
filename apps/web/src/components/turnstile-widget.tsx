'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useTheme } from 'next-themes';
import { type ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps): ReactNode {
  const { resolvedTheme } = useTheme();

  return (
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={onVerify}
      onExpire={() => {
        onExpire?.();
      }}
      options={{
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        size: 'flexible',
      }}
    />
  );
}
