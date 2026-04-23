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

## Subtasks

### 8.1. Practice/Practice-Song 도메인 타입 정의 및 API 함수 구현

**Status:** pending  
**Dependencies:** None  

합주(Practice)와 합주곡(Practice-Song) 도메인의 요청/응답 DTO 타입을 정의하고, 백엔드 API와 통신하는 함수들을 구현합니다.

**Details:**

1. src/domain/practice/types/req.ts 생성:
   - CreatePracticeRequest: title(선택), song(songId), venue(선택), startAt(yyyy-MM-dd HH:mm), durationMinutes
   - UpdateScheduleRequest: startAt, durationMinutes
   - UpdateVenueRequest: venue
   - CreateSessionRequest: label, type(SessionType)
   - AddParticipantRequest: memberId
   - AssignSessionRequest: participantId

2. src/domain/practice/types/res.ts 생성:
   - CreatePracticeResponse: practiceId, practiceTitle
   - PracticeDetailResponse: practiceId, title, venue, startAt, durationMinutes, song(songId, title, artist), sessions[], participants[]
   - PracticeSessionResponse: sessionId, label, type, participant(participantId, memberId) | null
   - PracticeParticipantResponse: participantId, memberId
   - PracticeSummaryResponse: 목록용 간단 응답 타입

3. src/domain/practice/api/ 함수들 생성 (apiClient 활용):
   - createPractice.ts: POST /api/v1/practices
   - getPractice.ts: GET /api/v1/practices/:id
   - getPractices.ts: GET /api/v1/practices (밴드 필터 지원)
   - deletePractice.ts: DELETE /api/v1/practices/:id
   - updateSchedule.ts: PATCH /api/v1/practices/:id/schedule
   - updateVenue.ts: PATCH /api/v1/practices/:id/venue
   - createSession.ts: POST /api/v1/practices/:id/sessions
   - deleteSession.ts: DELETE /api/v1/practices/:id/sessions/:sessionId
   - addParticipant.ts: POST /api/v1/practices/:id/participants
   - assignSession.ts: POST /api/v1/practices/:id/sessions/:sessionId/assign
   - unassignSession.ts: DELETE /api/v1/practices/:id/sessions/:sessionId/assign

4. src/domain/practice-song/types/req.ts:
   - UpsertRefLinkRequest: refLink

5. src/domain/practice-song/api/:
   - upsertRefLink.ts: PUT /api/v1/practice-songs/:songId/ref-link
   - deleteRefLink.ts: DELETE /api/v1/practice-songs/:songId/ref-link

### 8.2. Practice/Practice-Song TanStack Query 훅 구현

**Status:** pending  
**Dependencies:** 8.1  

타입 정의와 API 함수를 기반으로 TanStack Query의 useQuery/useMutation 훅을 구현합니다. 낙관적 업데이트 패턴을 적용합니다.

**Details:**

1. src/domain/practice/hooks/ 생성:
   - usePractice.ts: useQuery로 단일 합주 조회 (queryKeys.practice.detail 활용)
   - usePractices.ts: useInfiniteCursor로 합주 목록 조회 (밴드 필터 지원, queryKeys.practice.list 활용)
   - useCreatePractice.ts: useMutation + onSuccess에서 practice list invalidate
   - useDeletePractice.ts: useMutation + onSuccess에서 practice list invalidate + 성공 토스트
   - useUpdateSchedule.ts: useMutation + 낙관적 업데이트 (queryClient.setQueryData)
   - useUpdateVenue.ts: useMutation + 낙관적 업데이트
   - useCreateSession.ts: useMutation + practice detail invalidate
   - useDeleteSession.ts: useMutation + practice detail invalidate
   - useAddParticipant.ts: useMutation + practice detail invalidate
   - useAssignSession.ts: useMutation + 낙관적 업데이트 (세션 배정 즉시 반영)
   - useUnassignSession.ts: useMutation + 낙관적 업데이트

2. src/domain/practice-song/hooks/ 생성:
   - useUpsertSongRefLink.ts: useMutation
   - useDeleteSongRefLink.ts: useMutation

3. 낙관적 업데이트 구현 시:
   - onMutate에서 이전 데이터 스냅샷 저장
   - queryClient.setQueryData로 UI 즉시 반영
   - onError에서 롤백
   - onSettled에서 invalidate

4. useToast 훅을 활용하여 성공/실패 토스트 표시

### 8.3. Practice 도메인 UI 컴포넌트 구현

**Status:** pending  
**Dependencies:** 8.1  

합주 목록, 상세 화면에서 사용할 재사용 가능한 도메인 전용 UI 컴포넌트들을 구현합니다.

**Details:**

1. src/domain/practice/components/ 생성:

2. PracticeCard.tsx:
   - Card 컴포넌트 기반
   - 제목, 곡 정보, 일정(PracticeScheduleBadge), 장소 표시
   - interactive 옵션으로 클릭 시 상세 이동

3. PracticeScheduleBadge.tsx:
   - Badge 컴포넌트 기반
   - startAt, durationMinutes를 받아 '4월 25일 14:00 (90분)' 형식 표시
   - formatKst 헬퍼 활용

4. PracticeVenueInline.tsx:
   - 장소 인라인 편집 컴포넌트
   - 읽기 모드: 텍스트 + 편집 아이콘
   - 편집 모드: Input + 저장/취소 버튼
   - useUpdateVenue 훅 연동

5. SessionChip.tsx:
   - Chip 컴포넌트의 session prop 활용
   - SessionType별 색상 (VOCAL: 250, GUITAR: 40, BASS: 10, DRUM: 140 등 기존 정의 활용)
   - label 텍스트 표시

6. SessionRow.tsx:
   - 세션 정보 + 배정 상태 표시
   - SessionChip + 배정된 멤버 이름 또는 '미배정'
   - SessionAssignButton 포함
   - 세션 삭제 버튼 (권한 있을 때만)

7. SessionAssignButton.tsx:
   - 미배정 시: '배정하기' 버튼 → 참여자 선택 드롭다운
   - 배정됨 시: '해제' 버튼
   - useAssignSession, useUnassignSession 훅 연동
   - 낙관적 업데이트로 즉각 반영

8. SongRefLinkEditor.tsx:
   - 곡 참조 링크 인라인 편집
   - 링크 있으면: 링크 표시 + 편집/삭제 버튼
   - 링크 없으면: 추가 버튼
   - useUpsertSongRefLink, useDeleteSongRefLink 훅 연동

### 8.4. 합주 목록 페이지 및 생성 폼 구현

**Status:** pending  
**Dependencies:** 8.2, 8.3  

합주 목록 페이지(/practices)와 합주 생성 페이지(/practices/new)를 구현합니다.

**Details:**

1. src/app/(main)/practices/page.tsx 수정:
   - PageTitle 컴포넌트 활용
   - Suspense + Skeleton으로 로딩 상태
   - usePractices 훅으로 목록 조회 (무한 스크롤)
   - PracticeCard로 목록 렌더링
   - EmptyState: '등록된 합주가 없습니다' + 새 합주 만들기 버튼
   - 밴드 필터 (선택사항)
   - FAB 또는 헤더에 '새 합주' 버튼 → ROUTES.PRACTICE_NEW로 이동

2. src/app/(main)/practices/new/page.tsx 생성:
   - RSC로 페이지 구조
   - PracticeCreateForm.client.tsx 클라이언트 컴포넌트 임포트

3. src/domain/practice/components/PracticeCreateForm.client.tsx 생성:
   - 'use client' 선언
   - react-hook-form + zod 스키마
   - 필드: title(선택), song(songId - Select 또는 검색), venue(선택), startAt(datetime-local), durationMinutes(number)
   - CreatePracticeRequest에 맞춰 폼 데이터 변환
   - useCreatePractice 훅 연동
   - 성공 시: 토스트 + ROUTES.PRACTICE_DETAIL(practiceId)로 리다이렉트
   - 실패 시: 에러 메시지 표시

4. zod 스키마 (src/domain/practice/types/schema.ts):
   - title: z.string().max(100).optional()
   - song: z.string().min(1, '곡을 선택해주세요')
   - venue: z.string().max(200).optional()
   - startAt: z.string().datetime 또는 커스텀 검증
   - durationMinutes: z.number().min(15).max(480)

### 8.5. 합주 상세 페이지 구현 (일정/장소 편집, 세션 관리, 참여자, 삭제)

**Status:** pending  
**Dependencies:** 8.2, 8.3  

합주 상세 페이지(/practices/[practiceId])에서 일정/장소 편집, 세션 편성, 참여자 관리, 곡 참조 링크 관리, 삭제 기능을 구현합니다.

**Details:**

1. src/app/(main)/practices/[practiceId]/page.tsx 생성:
   - RSC로 practiceId params 추출
   - Suspense + Skeleton으로 로딩
   - PracticeDetail.client.tsx 클라이언트 컴포넌트 임포트

2. src/domain/practice/components/PracticeDetail.client.tsx 생성:
   - 'use client' 선언
   - usePractice(practiceId) 훅으로 상세 조회
   - ErrorState/Loading 상태 처리

3. 일정 섹션:
   - PracticeScheduleBadge로 현재 일정 표시
   - 편집 버튼 → 모달 또는 인라인 폼
   - useUpdateSchedule 훅 연동

4. 장소 섹션:
   - PracticeVenueInline 컴포넌트 사용
   - 인라인 편집 지원

5. 세션 편성 섹션:
   - '세션 추가' 버튼 → 모달(label, type 선택)
   - useCreateSession 훅 연동
   - 세션 목록: SessionRow 컴포넌트로 렌더링
   - 각 세션에 배정/해제 버튼 (SessionAssignButton)
   - 세션 삭제: useConfirmDialog + useDeleteSession

6. 참여자 섹션:
   - 현재 참여자 목록 표시
   - '참여자 추가' 버튼 → 멤버 선택 드롭다운
   - useAddParticipant 훅 연동

7. 곡 참조 링크 섹션:
   - SongRefLinkEditor 컴포넌트 사용
   - practice.song 정보 표시

8. 삭제 기능:
   - '합주 삭제' 버튼 (danger variant)
   - useConfirmDialog로 확인 다이얼로그
   - useDeletePractice 훅 연동
   - 성공 시: 토스트 + ROUTES.PRACTICES로 리다이렉트

9. 권한 체크:
   - 편집/삭제 버튼은 LEADER/ADMIN 권한 시에만 표시 (향후 useBandRole 연동)
