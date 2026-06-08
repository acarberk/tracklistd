'use client';

import { Compass, Home, Library, ListChecks, LogIn, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentType, type ReactNode } from 'react';

import { useUser } from '@/hooks/use-user';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface NavTab {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const PRIMARY_TABS = [
  { href: '/', key: 'home', icon: Home },
  { href: '/discover', key: 'discover', icon: Compass },
  { href: '/library', key: 'library', icon: Library },
  { href: '/lists', key: 'lists', icon: ListChecks },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function MobileNav(): ReactNode {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { isAuthenticated } = useUser();

  const lastTab: NavTab = isAuthenticated
    ? { href: '/profile', label: t('profile'), icon: User }
    : { href: '/login', label: t('signIn'), icon: LogIn };

  const tabs: NavTab[] = [
    ...PRIMARY_TABS.map((tab) => ({ href: tab.href, label: t(tab.key), icon: tab.icon })),
    lastTab,
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm sm:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
