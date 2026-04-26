# Bandage 프론트가 필요로 하는 API (백엔드 추가 요청 사항)

본 문서는 mvp-1-fix Task 15 실서버 검증과 Task 18~20 구현 과정에서 발견된, 현재 백엔드(`http://localhost:8080`)에 **존재하지 않거나 계약이 어긋나** 프론트가 mock 또는 우회 구현으로 대체한 API 항목을 정리한 것입니다. 백엔드 구현이 완료되면 프론트의 `domain/{name}/api/`만 교체하면 즉시 활성화됩니다.

작성일: 2026-04-26 (BE API_SPEC v3 갱신 반영) / 영향 범위: Bandage MVP 1차 보정 v3 / v4

## 0. mvp-1-fix-v3 Task 8 검증 결과 (2026-04-26) — BE 후속 대응 완료

상세 리포트: [`.taskmaster/reports/create-api-verification-2026-04-26.md`](./.taskmaster/reports/create-api-verification-2026-04-26.md)

| 항목                                                                              | 우선순위 | 상태                                                                                                |
| --------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `/bands/me` myRole 포함                                                           | —        | 해소 (정상 동작 확인)                                                                               |
| `/practices/me`, `/performances/me`, `/bands/search` 등 me/search 엔드포인트 일괄 | —        | 해소                                                                                                |
| `POST /performances` `bandIds` non-null 강제 (§6-1 명세 vs 실제 불일치)           | P0       | **해소** — BE 가 `bandIds: List<UUID>? = null` 로 변경 + 빈 배열 보정 (API_SPEC §6-1)               |
| Practice ↔ PracticeSong 닭-달걀 (FE-API-020)                                      | P0       | **해소** — BE §5-2/§5-3 의 `practiceId` 옵셔널화. FE 마법사가 PracticeSong 선행 생성 후 songId 전달 |
| 입력 검증 메시지 raw 노출                                                         | P1       | **해소** — BE `HttpMessageNotReadableException` 핸들러가 한국어 + fieldErrors 매핑                  |
| 공연/합주 startAt 과거 허용                                                       | P2       | **해소** — BE Practice/Performance 생성·수정·일정 변경 DTO 에 `@Future` 적용                        |

---

## 🔴 차단 (Blocking) — 기존 기능 동작 자체가 막힘

### 1. `GET /api/v1/practices` (목록 조회)

- **현재 응답**: `405 지원하지 않는 HTTP 메서드입니다`
- **프론트 사용처**: `domain/practice/api/getPractices.ts`, `usePractices`, 홈 "다가오는 합주" 섹션, `/practices` 라우트의 PaneList
- **요청 페이로드**:
  ```http
  GET /api/v1/practices?lastId=<uuid>&pageSize=20&bandId=<uuid>(optional)
  Authorization: Bearer <accessToken>
  ```
- **기대 응답**: `ApiResponse<CursorResponse<PracticeListItemResponse, string>>`

### 2. `POST /api/v1/bands` 의 `profileImg` 필수 처리

- **현재 동작**: `profileImg` null 시 400 (`Parameter specified as non-null is null`)
- **프론트 측 계약**: `CreateBandRequest.profileImg?: string`
- **요청**: 백엔드 Kotlin data class 의 `profileImg` 를 nullable(`String?`) 로 변경.

### 3. `GET /api/v1/members/me` 응답 필드 `memberId` vs `id`

- **현재 응답**: `{memberId, email, name, contact}`
- **프론트 타입**: `MemberInfoResponse.id`
- **요청**: `id` 로 키 통일하거나 프론트가 `memberId` 사용으로 마이그레이션. 프론트는 `memberId` 사용으로 우선 정렬 가능.

---

## 🟠 신규 기능 — Discovery / 탭 분리에 필요

### 4. 밴드 디스커버리 검색 (Task 18 / 19)

**현재**: `GET /api/v1/bands` 는 단순 커서 목록만 제공.
**요청**:

```http
GET /api/v1/bands?q=<keyword>&genre=<genre>&memberOnly=<bool>&pageSize=20&lastId=<id>
```

- `q`: 밴드명 / 설명 부분 일치(공백 분리 OR)
- `genre`: 장르 (`ROCK | JAZZ | INDIE | ...`) — 향후 도메인 enum 도입 시
- `memberOnly`: true 시 본인 소속 밴드만, 기본 false (전체 탐색)
- 정렬: 멤버 수 desc, 또는 최근 활동 desc 옵션 (`sort=members|recent`)

**응답 예**:

```json
{ "success": true, "data": { "content": [...], "nextCursor": "...", "hasNext": true } }
```

**프론트 mock 대체**: 입력 시 클라이언트가 `bandName`/`description` 필드로 `toLowerCase().includes()` 필터. 백엔드가 위 필드를 추가하면 `useDiscoverySearch` hook 의 fetcher 만 교체.

### 5. 합주 / 공연 디스커버리 검색 (Task 18)

밴드 검색과 동일한 `q`, `pageSize`, `lastId` 시그니처를 `GET /api/v1/practices`, `GET /api/v1/performances` 에도 추가.

### 6. "내 소속" 필터 — Practice/Performance

- `GET /api/v1/practices?memberOnly=true` 또는 `GET /api/v1/me/practices`
- `GET /api/v1/performances?memberOnly=true` 또는 `GET /api/v1/me/performances`
- 현재는 같은 데이터셋을 동일 hook 으로 사용 — 본인 참여 여부 필드(`participating: bool`)가 응답에 포함되면 클라이언트 필터로도 가능.

---

## 🟡 도메인 스키마 확장 (P1 — 추후)

### 7. `BandInfoResponse` 풍부화

**현재 필드**: `bandId / bandName / description? / profileImg?` 4개.
**프로토타입 요구**: 장르(`genre`), 활동 지역(`region`), 멤버 수(`memberCount`), 활동 상태(`status: ACTIVE|INACTIVE|RECRUITING`), 결성일(`foundedAt`).

- 프로토타입 카드의 칩(`리더`, `관리자` 등) 외에 부가 메타가 표시되려면 백엔드 스키마 확장 필요.

### 8. `BandApplicationInfoResponse` 풍부화

- 신청자 정보(`applicantName`, `applicantProfileImg`) 와 신청 메시지(`message`) 필드 추가.
- 거절 시 사유(`rejectReason`) 필드 추가.
- **신청 일시(`appliedAt`)** 필드 추가 — 현재 신청 카드에 신청 시각 노출 불가, "신청 대기 중" 텍스트로 폴백 중. `handoff/specs/03-band.md` "신청 카드: 신청자 이름 + 신청일 + 상태 배지" 참조.

### 8-2. 멤버 강퇴 / 역할 변경 (밴드 설정)

- `DELETE /api/v1/bands/{bandId}/members/{bandMemberId}` — 리더의 멤버 강퇴
- `PATCH /api/v1/bands/{bandId}/members/{bandMemberId}/role` — 리더의 멤버 역할 변경 (LEADER 위임은 기존 API 유지, ADMIN ↔ MEMBER 강등/승급 신규)
- 프론트 사용처: 향후 "밴드 설정" 화면. 현재는 toast info 안내만 (P2).

### 8-4. 공연 참여 밴드 일괄 추가/제거 (FE-API-017)

mvp-1-fix-v3 Task 5 의 BandPickerModal 결과를 적용할 백엔드 엔드포인트가 존재하지 않음. 현재는 mock toast 안내만 표시.

- **POST `/api/v1/performances/{performanceId}/bands/batch`** — 다중 밴드 추가 (append 시맨틱)
  - Request Body: `{ "bandIds": [uuid, uuid, ...] }`
  - Response: `List<{ performanceBandId, bandId }>` (기존 `practices/batch` §6-6 패턴과 동일)
  - 권한: PerformanceManager
- **DELETE `/api/v1/performances/{performanceId}/bands/{bandId}`** — 단건 제거
  - 권한: PerformanceManager
- **프론트 사용처**: `PerformanceDetailContent` `참여 밴드 추가` 버튼 → `BandPickerModal` 다중 선택 결과 batch 호출, 칩 X 클릭 → DELETE 단건
- **현재 우회**: 모달 확인 시 `toast.info('FE-API-017 후 자동 반영')` 안내. 실제 부착은 백엔드 엔드포인트 도입 후 fetcher 만 교체.

### 8-5. 멤버 검색 (FE-API-021)

`MemberPickerModal` 이 클라이언트 측 `getBandMembers` 100건 + name 부분 매칭으로 우회 중. 향후 멤버 풀이 커지면 비효율.

- **GET `/api/v1/bands/{bandId}/members/search?keyword=`** 또는 글로벌 `GET /api/v1/members/search?keyword=`
- **응답**: `BandMemberInfoResponse[]` (또는 `MemberInfoResponse[]`)
- **프론트 사용처**: `MemberPickerModal` (현재는 신규 사용처 없음 — 합주 멤버 추가 picker 도입 시 활성화)

### 8-6. 합주곡 검색 + Practice 생성 닭-달걀 해결 (FE-API-020) — **✅ 해소 (2026-04-26)**

BE 가 §5-2/§5-3 의 `practiceId` 를 옵셔널화 (해결안 2 채택). 마법사는 PracticeSong 선행 생성 후 응답 `songId` 를 §4-1 의 `song` 으로 전달하는 시퀀스로 동작.

- **프론트 사용처**: `PracticeCreateWizard.submit` — `createPracticeSongFromSong({song})` 또는 `createPracticeSongFromFields({...})` 호출 후 응답 songId 를 `useCreatePractice` 의 `song` 으로 전달
- 후속 라운드에서 실서버 재검증 필요

### 8-8. 밴드 정보 수정 / 삭제 (FE-API-022, FE-API-023)

밴드 설정 모달이 도입됐지만 백엔드에 엔드포인트가 없음. 본 라운드는 UI 만 완성, 동작 시 toast 안내.

- **PATCH `/api/v1/bands/{bandId}`** (FE-API-022) — 리더만, body: `{ name?, description? }`. Partial update.
- **DELETE `/api/v1/bands/{bandId}`** (FE-API-023) — 리더만. 응답 204. 멤버·합주·공연 연결 cascade 정리 정책 결정 필요.
- **POST `/api/v1/bands/{bandId}/profile-image`** (FE-API-009 — P2 항목 활성화) — 멀티파트 업로드 또는 사전서명 URL.
- 프론트 사용처: `BandSettingsModal` (정보/사진/삭제 탭)

### 8-7. 홈 피드 우선순위 정렬 (FE-API-019)

홈 화면 '내 밴드 / 다가오는 합주 / 다가오는 공연' 섹션은 현재 클라이언트 측 `lib/home-feed.ts` 의 `pickUpcoming` 으로 startAt 오름차순 + 미래 필터링 + 상위 3건. 향후 백엔드가 활동성/우선순위 알고리즘을 적용한 별도 엔드포인트를 제공하면 클라이언트 정렬 제거 가능.

- **GET `/api/v1/members/me/home-feed?limit=3`** (제안)
- **응답**: `{ bands: [...], upcomingPractices: [...], upcomingPerformances: [...] }` 또는 도메인별 분리 엔드포인트
- **프론트 사용처**: `UpcomingPractices`, `UpcomingPerformances`, `MyBands` (홈 한정 limit=3)
- **현재 우회**: `pickUpcoming` 클라이언트 정렬

### 8-3. 멤버 표시명 정상화 (FE-API-012 / 013 / 014)

화면에 UUID·숫자 ID 가 노출되지 않도록 `getMemberDisplayName` 유틸이 `name` 우선 → 마지막 4자리 폴백을 적용 중. 백엔드가 아래 응답에 `name` 을 포함하면 자동으로 정상화된다.

- **FE-API-012** `BandMemberInfoResponse` — `name: string`, `profileImg?: string` 추가
- **FE-API-013** `BandApplicationInfoResponse` — `applicantName: string`, `applicantProfileImg?: string` 추가 (8 항목과 일관)
- **FE-API-014** `PracticeParticipantResponse` 및 `PracticeSessionResponse.participant` — `name: string` 추가
- 프론트 사용처: `BandMemberRow`, `BandApplicationRow`, `SessionRow`, `PracticeDetailContent` 참여자 목록
- 현재 우회: `name` 미존재 시 `"멤버 #{memberId 마지막 4자리}"` 표시

### 9. 프로필 이미지 업로드 엔드포인트

- `POST /api/v1/members/me/profile-image` (멀티파트) 또는 사전 서명 URL 발급 후 S3 직접 업로드.
- 밴드 프로필 동일 (`POST /api/v1/bands/{id}/profile-image`).

### 10. 합주곡(Practice Song) 마스터 데이터

- 현재 `POST /practices` 에서 `song` 필드에 songId UUID 직접 입력 — 사용자 친화 검색이 어려움.
- `GET /api/v1/practice-songs?q=` 검색 + 자동완성 엔드포인트.

### 11. 공연 포스터 / 티켓 링크

- `PerformanceDetailResponse` 에 `posterImg`, `ticketUrl`, `mapPlaceId` 등.

### 12. 홈 사용자 통계 (FE-API-014)

- **엔드포인트**: `GET /api/v1/members/me/stats`
- **요청 헤더**: `Authorization: Bearer <accessToken>`
- **기대 응답 (`ApiResponse<MemberStatsResponse>`)**:

```json
{
  "success": true,
  "data": {
    "bandCount": 3,
    "upcomingPracticeCount": 2,
    "upcomingPerformanceCount": 1,
    "sessionCount": 5
  }
}
```

- **프론트 사용처**: `src/app/(main)/home/HomeStatCards.client.tsx` 4번째 카드 ("참여 세션")
- **현재 우회**: `bandCount` / `upcomingPractice/Performance` 는 각 list API 의 `length` 로 대체, `sessionCount` 는 `'—'` mock 표시.
- **백엔드 체크리스트**: `MemberStatsResponse` DTO, `MemberService.getStats(memberId)`, 컨트롤러 + 권한 체크(자신만), JPA 통계 쿼리 또는 도메인 별 카운트 합산.

---

## 선곡 회의 (mvp-1-fix-v5, 2026-04-26)

선곡 회의 기능은 **백엔드 미구현** 상태로 FE 단독(Zustand persist=sessionStorage) mock-first 로 출시. 아래 엔드포인트가 도입되면 `domain/setlist-meeting/store/setlistStore` 의 액션을 fetcher 로 교체.

### FE-API-024 회의 CRUD

```
POST   /api/v1/setlist-meetings
GET    /api/v1/setlist-meetings/me
GET    /api/v1/setlist-meetings/{meetingId}
DELETE /api/v1/setlist-meetings/{meetingId}
```

- **요청(POST)**: `{ title, bandId }`. `managerId` 는 서버가 토큰에서 추출.
- **응답**: `SetlistMeetingResponse { meetingId, bandId, bandName, title, managerId, createdAt, updatedAt }`
- **권한**: 생성=인증 + 해당 밴드 멤버, 삭제=매니저만.
- **프론트 사용처**: `MeetingCreateModal.client.tsx`, `SetlistMeetingsListPane.client.tsx`.

### FE-API-025 곡 CRUD

```
POST   /api/v1/setlist-meetings/{meetingId}/songs
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{songId}
```

- **요청(POST)**: `{ title, artist, album?, note?, sessions: SessionDef[] }`.
- **응답**: `SongResponse` (전체 필드 + 빈 applicants/confirmed 버킷).
- **프론트 사용처**: `AddSongModal.client.tsx` → `store.addSong`.

### FE-API-026 세션 정의 변경 (커스텀 세션)

```
PATCH /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions
```

- **요청**: `{ add?: SessionDef[], remove?: string[] }`.
- **권한**: 매니저만.

### FE-API-027 세션 지원 / 철회

```
POST   /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions/{sessionId}/applicants
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions/{sessionId}/applicants/{userId}
```

- 본인만 가능 (path userId 와 토큰 userId 일치 검증).
- 철회 시 confirmed 도 함께 정리.
- **프론트 사용처**: `SessionPanel.client.tsx` → `applySession` / `withdrawSession`.

### FE-API-028 세션 확정 / 해제 (매니저)

```
PATCH /api/v1/setlist-meetings/{meetingId}/songs/{songId}/sessions/{sessionId}/confirmations
```

- **요청**: `{ confirm?: string[], unconfirm?: string[] }`.
- **권한**: 매니저만. 정원(`need`) 초과 확정 시 400.
- **프론트 사용처**: `SessionPanel.client.tsx` → `confirmSession` / `unconfirmSession`.

### FE-API-029 곡별 채팅

```
GET  /api/v1/setlist-meetings/{meetingId}/songs/{songId}/chat?cursor=...
POST /api/v1/setlist-meetings/{meetingId}/songs/{songId}/chat
```

- **응답**: `CursorResponse<ChatMessage, string>` — `{ userId, at: ISO, msg }`.
- 권한: 회의 참여 멤버.
- **프론트 사용처**: `MeetingChatBox.client.tsx` → `sendChat`.

### FE-API-030 회의 → 합주 변환

```
POST /api/v1/setlist-meetings/{meetingId}/convert-to-practices
```

- **요청**: `{ scheduleAt: ISO, venue?: string, songIds: string[] }`.
- **응답**: 생성된 `practiceId` 목록.
- 합주 가능(`isReady`) 곡만 선택 가능. 매니저 권한.

---

## ℹ️ 참고 — 프론트 mock / 우회 현황 (2026-04-25 기준)

| 영역              | 우회 방법                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| 밴드 검색         | `useBandList` 의 모든 페이지를 펼쳐 클라이언트 `includes` 필터                                  |
| 내 소속 / 탐색 탭 | 동일 `useBandList` 결과를 두 탭이 공유, 향후 `memberOnly=true` 로 분리                          |
| 합주 목록         | 405 차단 — 홈/리스트 패널이 빈 상태 (백엔드 GET /practices 시급)                                |
| 합주곡 검색       | songId UUID 입력 폼 유지                                                                        |
| 프로필 사진       | URL 입력 텍스트 폼 유지 (업로드 미지원)                                                         |
| 알림              | 미구현                                                                                          |
| 선곡 회의         | 전체 도메인이 Zustand persist(sessionStorage) + 시드 mock — FE-API-024~030 도입 시 fetcher 교체 |

---

## 🔄 활성화 절차 (백엔드 구현 완료 시)

1. 위 항목 중 구현된 엔드포인트 명세를 `API_SPEC.md` 에 추가/업데이트.
2. 프론트 `domain/{name}/api/` 의 fetcher 시그니처를 새 query/필드에 맞춰 갱신.
3. `useDiscoverySearch` 등 mock 대체 hook 의 fetcher 만 교체 (UI 불변).
4. `.taskmaster/report/mvp-1-fix-integration-YYYY-MM-DD.md` 후속 검증 라운드를 실시해 mock 의존이 해소됐는지 확인.
