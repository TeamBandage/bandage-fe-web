import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { PracticesList } from './PracticesList.client';

export const metadata: Metadata = {
  title: '합주 | Bandage',
};

export default function PracticesPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="합주" description="예정된 합주 일정과 세션 편성을 확인하세요." />
      <PracticesList />
    </div>
  );
}
