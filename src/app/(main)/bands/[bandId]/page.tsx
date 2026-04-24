import type { Metadata } from 'next';

import { BandDetailContent } from './BandDetailContent.client';

export const metadata: Metadata = {
  title: '밴드 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ bandId: string }>;
};

export default async function BandDetailPage({ params }: PageProps) {
  const { bandId } = await params;
  return <BandDetailContent bandId={bandId} />;
}
