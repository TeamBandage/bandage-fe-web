import type { ReactNode } from 'react';

import { BottomNav } from '@/components/layout/bottom-nav';
import { Container } from '@/components/layout/container';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      <Container maxWidth="xl" padding className="py-6">
        {children}
      </Container>
      <BottomNav />
    </div>
  );
}
