import type { Metadata } from 'next';
import { Suspense } from 'react';

import { BandsMobileShell } from './BandsMobileShell.client';

export const metadata: Metadata = {
  title: '밴드 | Bandage',
};

export default function BandsPage() {
  return (
    <Suspense fallback={null}>
      <div className="p-s-4 lg:pt-10">
        <BandsMobileShell />
      </div>
    </Suspense>
  );
}
