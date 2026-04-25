import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { PracticesListPane } from './PracticesListPane.client';

export default function PracticesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Suspense fallback={null}>
        <PracticesListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
