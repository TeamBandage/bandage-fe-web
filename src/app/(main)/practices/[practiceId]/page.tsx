import type { Metadata } from 'next';

import { PracticeDetailContent } from './PracticeDetailContent.client';

export const metadata: Metadata = {
  title: '합주 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ practiceId: string }>;
};

export default async function PracticeDetailPage({ params }: PageProps) {
  const { practiceId } = await params;
  return <PracticeDetailContent practiceId={practiceId} />;
}
