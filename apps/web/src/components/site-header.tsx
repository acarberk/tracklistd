import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';

import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Discover' },
  { href: '/library', label: 'Library' },
] as const;

export function SiteHeader(): ReactNode {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Gamepad2 className="h-5 w-5 text-primary" />
            <span>Tracklistd</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={cn(buttonVariants({ size: 'sm' }))}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
