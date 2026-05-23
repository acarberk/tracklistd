import { type ReactNode } from 'react';

interface GameDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps): Promise<ReactNode> {
  const { slug } = await params;
  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold">{slug}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Game detail page coming in the next PR.</p>
    </main>
  );
}
