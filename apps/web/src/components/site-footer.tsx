import { useTranslations } from 'next-intl';

import type { ReactNode } from 'react';

export function SiteFooter(): ReactNode {
  const t = useTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border bg-background py-6 text-sm text-muted-foreground">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
        <span>{t('footer.copyright', { year })}</span>
        <span>{t('site.tagline')}</span>
      </div>
    </footer>
  );
}
