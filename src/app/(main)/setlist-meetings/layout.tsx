import { type ReactNode } from 'react';

import { SetlistMeetingsShell } from './SetlistMeetingsShell.client';

/**
 * /setlist-meetings 라우트 레이아웃.
 * 좌측 회의 목록 패널은 SetlistMeetingsShell 가 오버레이 모드로 토글.
 */
export default function SetlistMeetingsLayout({ children }: { children: ReactNode }) {
  return <SetlistMeetingsShell>{children}</SetlistMeetingsShell>;
}
