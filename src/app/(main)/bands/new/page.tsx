import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';
import { BandCreateForm } from '@/domain/band/components/BandCreateForm.client';

export const metadata: Metadata = {
  title: '밴드 만들기 | Bandage',
};

export default function BandNewPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="밴드 만들기" description="새 밴드의 기본 정보를 입력하세요." />
      <BandCreateForm />
    </div>
  );
}
