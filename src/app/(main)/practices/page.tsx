import type { Metadata } from 'next';
import { Music } from 'lucide-react';

import { EmptyPane } from '@/components/feedback/empty-pane';
import { PageTitle } from '@/components/layout/page-title';

import { PracticesList } from './PracticesList.client';

export const metadata: Metadata = {
  title: '합주 | Bandage',
};

export default function PracticesPage() {
  return (
    <>
      <div className="space-y-s-6 p-s-4 lg:hidden">
        <PageTitle title="합주" description="예정된 합주 일정과 세션 편성을 확인하세요." />
        <PracticesList />
      </div>
      <div className="hidden h-full lg:block">
        <EmptyPane
          icon={Music}
          title="합주를 선택해 주세요"
          description="왼쪽 목록에서 합주를 선택하면 상세 정보가 이곳에 표시됩니다."
        />
      </div>
    </>
  );
}
