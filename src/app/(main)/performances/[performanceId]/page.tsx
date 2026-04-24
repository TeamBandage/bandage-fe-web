import type { Metadata } from 'next';

import { PerformanceDetailContent } from './PerformanceDetailContent.client';

export const metadata: Metadata = {
  title: '공연 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ performanceId: string }>;
};

export default async function PerformanceDetailPage({ params }: PageProps) {
  const { performanceId } = await params;
  return <PerformanceDetailContent performanceId={performanceId} />;
}
