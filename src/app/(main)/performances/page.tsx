import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { PerformancesList } from './PerformancesList.client';

export const metadata: Metadata = {
  title: '공연 | Bandage',
};

export default function PerformancesPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="공연" description="예정된 공연 일정과 연결된 합주를 확인하세요." />
      <PerformancesList />
    </div>
  );
}
