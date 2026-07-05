import type { Metadata } from 'next';

import { SetlistDetail } from './SetlistDetail.client';

export const metadata: Metadata = {
  title: '셋리스트 | Bandage',
};

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ setlistId: string }>;
}) {
  const { setlistId } = await params;
  return <SetlistDetail setlistId={setlistId} />;
}
