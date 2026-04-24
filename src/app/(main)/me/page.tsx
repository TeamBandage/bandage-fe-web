import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';

import { MeContent } from './MeContent.client';

export const metadata: Metadata = {
  title: 'MY | Bandage',
};

export default function MyPage() {
  return (
    <div className="space-y-s-6 p-s-4 lg:py-s-8 mx-auto w-full max-w-3xl">
      <PageTitle title="MY" description="프로필과 계정 설정" />
      <MeContent />
    </div>
  );
}
