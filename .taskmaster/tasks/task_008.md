# Task ID: 8

**Title:** 합주(Practice) 및 합주곡(Practice-Song) 도메인 구현

**Status:** pending

**Dependencies:** 7

**Priority:** medium

**Description:** 합주 생성/상세 조회/일정·장소 변경/삭제, 세션 생성/삭제, 멤버 추가, 세션 배정/해제, 곡 참조 링크 관리 기능을 구현합니다.

**Details:**

1. src/domain/practice/types/req.ts:
```ts
export interface CreatePracticeRequest {
  title?: string;
  song: string; // songId
  venue?: string;
  startAt: string; // yyyy-MM-dd HH:mm
  durationMinutes: number;
}

export interface UpdateScheduleRequest {
  startAt: string;
  durationMinutes: number;
}

export interface UpdateVenueRequest {
  venue: string;
}

export interface CreateSessionRequest {
  label: string;
  type: SessionType;
}

export interface AddParticipantRequest {
  memberId: number;
}
```

2. src/domain/practice/types/res.ts:
```ts
export interface CreatePracticeResponse {
  practiceId: string;
  practiceTitle: string;
}

export interface PracticeDetailResponse {
  practiceId: string;
  title: string;
  venue?: string;
  startAt: string;
  durationMinutes: number;
  song: { songId: string; title: string; artist: string; };
  sessions: PracticeSessionResponse[];
  participants: PracticeParticipantResponse[];
}

export interface PracticeSessionResponse {
  sessionId: string;
  label: string;
  type: SessionType;
  participant: { participantId: string; memberId: number; } | null;
}

export interface PracticeParticipantResponse {
  participantId: string;
  memberId: number;
}
```

3. src/domain/practice/api/:
- createPractice.ts, getPractice.ts, deletePractice.ts
- updateSchedule.ts, updateVenue.ts
- createSession.ts, deleteSession.ts
- addParticipant.ts, assignSession.ts, unassignSession.ts

4. src/domain/practice/hooks/: 각 API에 대응하는 useMutation/useQuery 훅

5. src/domain/practice-song/types/req.ts:
```ts
export interface UpsertRefLinkRequest {
  refLink: string;
}
```

6. src/domain/practice-song/api/upsertRefLink.ts, deleteRefLink.ts

7. src/domain/practice-song/hooks/useUpsertSongRefLink.ts, useDeleteSongRefLink.ts

8. src/domain/practice/components/:
- PracticeCard.tsx - 목록용
- PracticeScheduleBadge.tsx - 일정 표시
- PracticeVenueInline.tsx - 장소 인라인 편집
- SessionChip.tsx - 세션 타입별 색상(VOCAL: pink, GUITAR: orange 등)
- SessionRow.tsx - 세션 + 배정 상태 + 배정/해제 버튼
- SessionAssignButton.tsx - 낙관적 업데이트 처리
- SongRefLinkEditor.tsx - 곡 참조 링크 인라인 편집

9. src/app/(main)/practices/page.tsx - 내 밴드 합주 목록

10. src/app/(main)/practices/new/page.tsx + PracticeCreateForm.client.tsx:
- 제목/곡 선택/장소/시작시간/소요시간 입력

11. src/app/(main)/practices/[practiceId]/page.tsx:
- 일정/장소 편집 (인라인 또는 모달)
- 세션 편성 섹션: 세션 추가 버튼 + 각 세션에 배정 상태
- 참여자 목록 섹션
- 곡 참조 링크 섹션
- 삭제 버튼 (확인 다이얼로그)

**Test Strategy:**

합주 생성 → 세션 3개 추가 → 2명이 각각 세션 배정 → 장소 변경 → 곡 링크 추가/수정 → 삭제 플로우 수동 테스트, 세션 배정 낙관적 업데이트 단위 테스트
