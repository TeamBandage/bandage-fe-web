import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { PerformanceCreateForm } from './PerformanceCreateForm.client';

export const metadata: Metadata = {
  title: '공연 만들기 | Bandage',
};

export default function PerformanceNewPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="공연 만들기"
        description="공연 기본 정보를 입력하세요. 합주 연결은 생성 후 상세 페이지에서 추가할 수 있습니다."
      />
      <PerformanceCreateForm />
    </div>
  );
}
