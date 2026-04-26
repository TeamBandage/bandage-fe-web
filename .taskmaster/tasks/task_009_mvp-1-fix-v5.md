# Task ID: 9

**Title:** API_REQUIRED.md 선곡 회의 항목 등록 및 산출물 정리

**Status:** pending

**Dependencies:** 8

**Priority:** low

**Description:** API_REQUIRED.md에 FE-API-024~030 선곡 회의 관련 백엔드 요청 항목을 등록하고, 구현 산출물을 정리한다.

**Details:**

## API_REQUIRED.md 추가 항목

### FE-API-024 회의 CRUD
```http
POST /api/v1/setlist-meetings
GET /api/v1/setlist-meetings/me
GET /api/v1/setlist-meetings/{id}
DELETE /api/v1/setlist-meetings/{id}
```
- 요청/응답 DTO 명세
- 권한: 생성자=매니저, 삭제=매니저만

### FE-API-025 곡 CRUD
```http
POST /api/v1/setlist-meetings/{id}/songs
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{songId}
```

### FE-API-026 세션 정의
```http
PATCH /api/v1/setlist-meetings/{id}/songs/{songId}/sessions
```
- 커스텀 세션 추가/삭제

### FE-API-027 세션 지원
```http
POST /api/v1/setlist-meetings/.../sessions/{sessionId}/applicants
DELETE /api/v1/setlist-meetings/.../sessions/{sessionId}/applicants/{userId}
```

### FE-API-028 세션 확정/해제
```http
PATCH /api/v1/setlist-meetings/.../sessions/{sessionId}/confirmations
```
- 매니저만

### FE-API-029 채팅
```http
GET /api/v1/setlist-meetings/{id}/songs/{songId}/chat
POST /api/v1/setlist-meetings/{id}/songs/{songId}/chat
```

### FE-API-030 회의 → 합주 변환
```http
POST /api/v1/setlist-meetings/{id}/convert-to-practices
```

## 산출물 정리
- ROUTES.md에 /setlist-meetings 라우트 문서화
- 신규 파일 목록 + 역할 코멘트

**Test Strategy:**

1. API_REQUIRED.md 문서 형식 일관성 검증 (마크다운 lint)
2. 모든 FE-API-024~030 항목에 엔드포인트, 요청 body, 응답 예시, 권한 명시 확인
3. 각 toast.info 메시지가 올바른 FE-API 번호 참조 확인

## Subtasks

### 9.1. API_REQUIRED.md에 FE-API-024~030 선곡 회의 API 항목 등록

**Status:** pending  
**Dependencies:** None  

API_REQUIRED.md 파일에 선곡 회의(setlist-meeting) 관련 7개 API 엔드포인트 요청 사항을 기존 문서 형식에 맞춰 추가한다.

**Details:**

## 추가 섹션 위치
기존 `## 도메인 스키마 확장 (P1)` 섹션 아래 또는 신규 섹션 `## 신규 기능 — 선곡 회의 (Setlist Meeting)` 생성

## FE-API-024 회의 CRUD
```http
POST /api/v1/setlist-meetings
GET /api/v1/setlist-meetings/me
GET /api/v1/setlist-meetings/{id}
DELETE /api/v1/setlist-meetings/{id}
```
- 요청 body: `{ title, bandId, deadline? }`
- 응답: `SetlistMeetingResponse` / `SetlistMeetingDetailResponse`
- 권한: 생성=밴드 매니저, 삭제=생성자(매니저)만

## FE-API-025 곡 CRUD
```http
POST /api/v1/setlist-meetings/{id}/songs
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{songId}
```
- 요청 body: `{ title, artist, album?, comment?, customSessions? }`
- 권한: 밴드 멤버

## FE-API-026 세션 정의
```http
PATCH /api/v1/setlist-meetings/{id}/songs/{songId}/sessions
```
- 요청 body: `{ sessions: [{ label, short, need }] }`
- 커스텀 세션 추가/삭제

## FE-API-027 세션 지원
```http
POST /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions/{sessionId}/applicants
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions/{sessionId}/applicants/{userId}
```

## FE-API-028 세션 확정/해제
```http
PATCH /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions/{sessionId}/confirmations
```
- 요청 body: `{ confirmedUserIds: string[] }`
- 권한: 매니저만

## FE-API-029 채팅
```http
GET /api/v1/setlist-meetings/{id}/songs/{songId}/chat
POST /api/v1/setlist-meetings/{id}/songs/{songId}/chat
```
- 요청 body (POST): `{ content }`
- 응답: `ChatMessageResponse[]`

## FE-API-030 회의 → 합주 변환
```http
POST /api/v1/setlist-meetings/{id}/convert-to-practices
```
- 응답: 생성된 Practice ID 목록
- 권한: 매니저만

### 9.2. ROUTES.md에 /setlist-meetings 라우트 문서화

**Status:** pending  
**Dependencies:** 9.1  

ROUTES.md 파일에 선곡 회의 관련 라우트 정보를 기존 테이블 형식에 맞춰 추가한다.

**Details:**

## 추가 위치
`## (main) 탭 레이아웃` 테이블에 신규 행 추가

## 추가할 라우트
| 경로 | 설명 | 구현 Task |
| `/setlist-meetings` | 선곡 회의 목록 (마스터 패널) | Task 4 |
| `/setlist-meetings/{id}` | 선곡 회의 상세 (디테일 패널) | Task 5 |

## global/config/routes.ts 업데이트 필요 사항 명시
```ts
SETLIST_MEETINGS: '/setlist-meetings',
SETLIST_MEETING_DETAIL: (id: string) => `/setlist-meetings/${id}`,
```

## 백엔드 의존 섹션 업데이트
- 선곡 회의 API가 백엔드에 구현되기 전까지 mock/Zustand store로 동작
- FE-API-024~030 구현 후 실제 API 연결

### 9.3. 신규 파일 목록 및 역할 코멘트 정리

**Status:** pending  
**Dependencies:** 9.1, 9.2  

선곡 회의 도메인 구현으로 생성된 모든 신규 파일의 목록과 각 파일의 역할을 문서화한다.

**Details:**

## 문서화 위치
API_REQUIRED.md 하단 또는 별도 섹션 `## 선곡 회의 구현 산출물`

## 신규 파일 목록 (Task 2~8 구현 기준)

### 도메인 모듈 (src/domain/setlist-meeting/)
- `types.ts` — Meeting, Song, Session, Applicant, ChatMessage 타입 정의
- `store/setlistStore.ts` — Zustand 상태 관리 (회의/곡/세션/채팅)
- `mock/seed.ts` — 개발용 mock 데이터 (TOOL TRIBUTE 7곡 + 마그마 회의)
- `utils.ts` — 세션 상태 헬퍼 (sessionState, isReady, missingCount)

### 컴포넌트 (src/domain/setlist-meeting/components/)
- `SetlistMeetingsListPane.client.tsx` — 회의 목록 마스터 패널
- `MeetingCard.tsx` — 회의 카드 컴포넌트
- `MeetingDetail.client.tsx` — 회의 상세 디테일 영역
- `SongSessionTable.client.tsx` — 곡별 세션 테이블
- `SessionCell.client.tsx` — 세션 셀 (지원/확정 UI)
- `MeetingChatBox.client.tsx` — 곡별 채팅 분할 패널
- `AddSongModal.client.tsx` — 곡 추가 모달
- `MeetingCreateModal.client.tsx` — 회의 생성 모달

### 라우트 (src/app/(main)/setlist-meetings/)
- `page.tsx` — 첫 회의 자동 선택 redirect
- `layout.tsx` — 마스터/디테일 레이아웃
- `[id]/page.tsx` — 동적 라우트 상세 페이지

### 9.4. 프론트 mock/우회 현황 테이블 업데이트

**Status:** pending  
**Dependencies:** 9.1, 9.3  

API_REQUIRED.md의 '프론트 mock / 우회 현황' 테이블에 선곡 회의 도메인의 mock 상태를 추가한다.

**Details:**

## 업데이트 위치
`## 참고 — 프론트 mock / 우회 현황` 테이블

## 추가할 행
| 영역 | 우회 방법 |
| 선곡 회의 CRUD | Zustand store + sessionStorage persist (FE-API-024 대기) |
| 곡 추가/삭제 | store.addSong/removeSong mock 액션 (FE-API-025 대기) |
| 세션 지원/철회 | store.applySession/withdrawSession mock (FE-API-027 대기) |
| 세션 확정/해제 | store.confirmSession mock, 매니저 권한 체크 로컬 (FE-API-028 대기) |
| 곡별 채팅 | store.sendChat + 로컬 메시지 배열 (FE-API-029 대기) |
| 회의→합주 변환 | toast.info 안내만 (FE-API-030 대기) |

## 활성화 절차 섹션 업데이트
- 선곡 회의 관련 fetcher 교체 지점 명시
- `domain/setlist-meeting/api/` 폴더 생성 후 각 API 함수 구현 예정 안내
