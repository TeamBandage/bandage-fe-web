import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { PracticeCreateForm } from './PracticeCreateForm.client';

export const metadata: Metadata = {
  title: '합주 만들기 | Bandage',
};

export default function PracticeNewPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="합주 만들기"
        description="합주할 곡과 일정을 설정하세요. 세션·참여자는 생성 후 편집할 수 있습니다."
      />
      <PracticeCreateForm />
    </div>
  );
}
