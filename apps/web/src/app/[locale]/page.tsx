import { setRequestLocale } from 'next-intl/server';
import { type ReactNode } from 'react';

import { HomeContent } from './home-content';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps): Promise<ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}
