import type { Metadata } from 'next';

import { MeContent } from './MeContent.client';

export const metadata: Metadata = {
  title: 'MY | Bandage',
};

export default function MyPage() {
  return (
    <div className="space-y-s-6 py-s-4 mx-auto w-full max-w-4xl px-2.5 lg:py-10">
      <MeContent />
    </div>
  );
}
