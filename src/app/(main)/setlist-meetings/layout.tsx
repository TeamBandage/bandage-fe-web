import { Suspense, type ReactNode } from 'react';

import { SetlistMeetingsListPane } from './SetlistMeetingsListPane.client';

/**
 * /setlist-meetings 영역 마스터-디테일 레이아웃.
 * - lg(>=960px): 좌측 ListPane(280px) + 우측 children
 * - 모바일: ListPane 비노출 (BottomNav 로 회의 목록 ↔ 디테일 전환은 후속 PR 에서)
 */
export default function SetlistMeetingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Suspense fallback={null}>
        <SetlistMeetingsListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
