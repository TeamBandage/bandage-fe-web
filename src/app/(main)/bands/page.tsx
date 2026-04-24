import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { BandsList } from './BandsList.client';

export const metadata: Metadata = {
  title: '밴드 | Bandage',
};

export default function BandsPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="밴드" description="참여 중인 밴드를 확인하거나 새 밴드를 만드세요." />
      <BandsList />
    </div>
  );
}
