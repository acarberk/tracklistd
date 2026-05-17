import type { ReactNode } from 'react';

export function SiteFooter(): ReactNode {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border bg-background py-6 text-sm text-muted-foreground">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
        <span>&copy; {year} Tracklistd</span>
        <span>Track games, films, shows, and anime — all in one place.</span>
      </div>
    </footer>
  );
}
