import type { Metadata } from 'next';
import { Users } from 'lucide-react';

import { EmptyPane } from '@/components/feedback/empty-pane';
import { PageTitle } from '@/components/layout/page-title';

import { BandsList } from './BandsList.client';

export const metadata: Metadata = {
  title: '밴드 | Bandage',
};

export default function BandsPage() {
  return (
    <>
      {/* Mobile: 기존 리스트 페이지 */}
      <div className="space-y-s-6 p-s-4 lg:hidden">
        <PageTitle title="밴드" description="참여 중인 밴드를 확인하거나 새 밴드를 만드세요." />
        <BandsList />
      </div>
      {/* Desktop: 좌측 BandsListPane + EmptyPane */}
      <div className="hidden h-full lg:block">
        <EmptyPane
          icon={Users}
          title="밴드를 선택해 주세요"
          description="왼쪽 목록에서 밴드를 선택하면 상세 정보가 이곳에 표시됩니다."
        />
      </div>
    </>
  );
}
