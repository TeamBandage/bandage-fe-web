import type { Metadata } from 'next';

import { TrackSelectionsMobileShell } from './TrackSelectionsMobileShell.client';

export const metadata: Metadata = {
  title: '선곡 회의 | Bandage',
};

export default function TrackSelectionsPage() {
  return (
    <div className="p-s-4 lg:pt-10">
      <TrackSelectionsMobileShell />
    </div>
  );
}
