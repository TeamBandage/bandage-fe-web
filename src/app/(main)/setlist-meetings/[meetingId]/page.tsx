import { SetlistMeetingDetail } from './SetlistMeetingDetail.client';

/**
 * /setlist-meetings/{meetingId} 디테일 placeholder.
 * Task 5~7 에서 곡 표 / 채팅 / 우측 세션 패널이 채워진다.
 */
export default async function SetlistMeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <SetlistMeetingDetail meetingId={meetingId} />;
}
