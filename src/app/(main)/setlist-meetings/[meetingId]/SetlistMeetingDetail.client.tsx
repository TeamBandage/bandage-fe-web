'use client';

import { useEffect } from 'react';

import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';

/**
 * Task 4 단계의 placeholder. 회의 메타만 노출.
 * Task 5(곡 표) / Task 6(우측 세션 패널) / Task 7(채팅) 머지로 본격 구성됨.
 */
export function SetlistMeetingDetail({ meetingId }: { meetingId: string }) {
  const setSelectedMeeting = useSetlistStore((s) => s.setSelectedMeeting);
  const meeting = useSetlistStore((s) => s.meetings.find((m) => m.id === meetingId));
  const songCount = useSetlistStore(
    (s) => s.songs.filter((song) => song.meetingId === meetingId).length,
  );

  useEffect(() => {
    setSelectedMeeting(meetingId);
  }, [meetingId, setSelectedMeeting]);

  if (!meeting) {
    return (
      <div className="px-s-5 py-s-6">
        <p className="text-foreground-muted text-caption">회의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="px-s-5 py-s-6">
      <div className="text-accent text-caption font-semibold">{meeting.bandName}</div>
      <h1 className="text-title mt-s-1 font-bold">{meeting.title}</h1>
      <p className="text-foreground-muted text-caption mt-s-2">
        곡 {songCount}개 · 업데이트 {meeting.updatedAt}
      </p>
      <p className="text-foreground-muted text-body mt-s-5">
        곡 표 · 우측 세션 패널 · 채팅 패널은 곧 추가됩니다.
      </p>
    </div>
  );
}
