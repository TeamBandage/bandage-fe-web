import type { Metadata } from 'next';

import { SetlistsMobileShell } from './SetlistsMobileShell.client';

export const metadata: Metadata = {
  title: '셋리스트 | Bandage',
};

export default function SetlistsPage() {
  return (
    <div className="p-s-4 lg:pt-10">
      <SetlistsMobileShell />
    </div>
  );
}
