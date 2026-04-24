import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { MeContent } from './MeContent.client';

export const metadata: Metadata = {
  title: 'MY | Bandage',
};

export default function MyPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="MY" description="프로필과 계정 설정" />
      <MeContent />
    </div>
  );
}
