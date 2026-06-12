import type { Metadata } from 'next';
import { Users } from 'lucide-react';

import { EmptyPane } from '@/components/feedback/empty-pane';

import { BandsMobileShell } from './BandsMobileShell.client';

export const metadata: Metadata = {
  title: '밴드 | Bandage',
};

export default function BandsPage() {
  return (
    <>
      {/* Mobile: 풀스크린 탭 + 바텀시트 */}
      <div className="p-s-4 lg:hidden">
        <BandsMobileShell />
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
