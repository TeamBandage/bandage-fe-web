import type { Metadata } from 'next';

import { SchedulingMain } from './SchedulingMain.client';

export const metadata: Metadata = {
  title: '합주 일정 조율 | Bandage',
};

export default async function SchedulingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <SchedulingMain meetingId={meetingId} />;
}
