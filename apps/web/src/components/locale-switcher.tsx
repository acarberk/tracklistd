'use client';

import { useLocale } from 'next-intl';
import { useTransition, type ReactNode } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const LOCALES = [
  { value: 'en', label: 'EN' },
  { value: 'tr', label: 'TR' },
] as const;

type LocaleValue = (typeof LOCALES)[number]['value'];

export function LocaleSwitcher(): ReactNode {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: LocaleValue): void {
    if (next === locale) {
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center rounded-md border border-border bg-muted p-0.5 text-xs">
      {LOCALES.map((item) => {
        const active = item.value === locale;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              switchTo(item.value);
            }}
            disabled={isPending}
            aria-pressed={active}
            className={cn(
              'rounded-sm px-2 py-1 font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
