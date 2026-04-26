import type { Metadata } from 'next';

import { MeetingDetail } from './MeetingDetail.client';

export const metadata: Metadata = {
  title: '선곡 회의 상세 | Bandage',
};

export default async function SetlistMeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingDetail meetingId={meetingId} />;
}
