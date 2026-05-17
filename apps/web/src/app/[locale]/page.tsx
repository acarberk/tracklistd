import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps): Promise<ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomePageContent />;
}

function HomePageContent(): ReactNode {
  const tSite = useTranslations('site');
  const tHome = useTranslations('home.smokeTest');
  const tButtons = useTranslations('home.smokeTest.buttons');

  return (
    <main className="container mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <Sparkles className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">{tSite('name')}</h1>
        <p className="text-muted-foreground">{tSite('tagline')}</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{tHome('title')}</CardTitle>
          <CardDescription>{tHome('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder={tHome('inputPlaceholder')} />
          <div className="flex flex-wrap gap-2">
            <Button>{tButtons('default')}</Button>
            <Button variant="secondary">{tButtons('secondary')}</Button>
            <Button variant="outline">{tButtons('outline')}</Button>
            <Button variant="ghost">{tButtons('ghost')}</Button>
            <Button variant="destructive">{tButtons('destructive')}</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
