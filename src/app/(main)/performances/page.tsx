import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PerformancesMobileShell } from './PerformancesMobileShell.client';

export const metadata: Metadata = {
  title: '공연 | Bandage',
};

export default function PerformancesPage() {
  return (
    <Suspense fallback={null}>
      <div className="p-s-4 lg:pt-10">
        <PerformancesMobileShell />
      </div>
    </Suspense>
  );
}
