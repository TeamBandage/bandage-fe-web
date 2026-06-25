import type { Metadata } from 'next';

import { JamDetailContent } from './JamDetailContent.client';

export const metadata: Metadata = {
  title: '합주 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ jamId: string }>;
};

export default async function JamDetailPage({ params }: PageProps) {
  const { jamId } = await params;
  return (
    <div className="px-5 py-4 lg:px-8 lg:py-6">
      <JamDetailContent jamId={jamId} />
    </div>
  );
}
