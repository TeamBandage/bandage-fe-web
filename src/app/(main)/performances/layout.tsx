import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { PerformancesListPane } from './PerformancesListPane.client';

export default function PerformancesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Suspense fallback={null}>
        <PerformancesListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
