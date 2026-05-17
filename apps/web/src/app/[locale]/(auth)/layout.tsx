import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <main className="container mx-auto flex max-w-md flex-col items-center justify-center gap-6 px-4 py-16">
      {children}
    </main>
  );
}
