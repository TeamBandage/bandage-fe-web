import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JamsMobileShell } from './JamsMobileShell.client';

export const metadata: Metadata = {
  title: '합주 | Bandage',
};

export default function PracticesPage() {
  return (
    <Suspense fallback={null}>
      <div className="p-s-4 lg:pt-10">
        <JamsMobileShell />
      </div>
    </Suspense>
  );
}
