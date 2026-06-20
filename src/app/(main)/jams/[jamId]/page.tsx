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
  return <JamDetailContent jamId={jamId} />;
}
