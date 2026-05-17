import { Sparkles } from 'lucide-react';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function HomePage(): ReactNode {
  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Sparkles className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Tracklistd</h1>
        <p className="text-muted-foreground">
          Track games, films, shows, and anime — all in one place.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>UI components smoke test</CardTitle>
          <CardDescription>shadcn/ui + Tailwind v4 + CSS variables wired up.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder="Type something..." />
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
