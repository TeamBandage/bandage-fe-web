# Bandage 프론트가 필요로 하는 API (백엔드 추가 요청 사항)

본 문서는 mvp-1-fix Task 15 실서버 검증과 Task 18~20 구현 과정에서 발견된, 현재 백엔드(`http://localhost:8080`)에 **존재하지 않거나 계약이 어긋나** 프론트가 mock 또는 우회 구현으로 대체한 API 항목을 정리한 것입니다. 백엔드 구현이 완료되면 프론트의 `domain/{name}/api/`만 교체하면 즉시 활성화됩니다.

작성일: 2026-04-25 / 영향 범위: Bandage MVP 1차 보정

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

### 9. 프로필 이미지 업로드 엔드포인트

- `POST /api/v1/members/me/profile-image` (멀티파트) 또는 사전 서명 URL 발급 후 S3 직접 업로드.
- 밴드 프로필 동일 (`POST /api/v1/bands/{id}/profile-image`).

### 10. 합주곡(Practice Song) 마스터 데이터

- 현재 `POST /practices` 에서 `song` 필드에 songId UUID 직접 입력 — 사용자 친화 검색이 어려움.
- `GET /api/v1/practice-songs?q=` 검색 + 자동완성 엔드포인트.

### 11. 공연 포스터 / 티켓 링크

- `PerformanceDetailResponse` 에 `posterImg`, `ticketUrl`, `mapPlaceId` 등.

---

## ℹ️ 참고 — 프론트 mock / 우회 현황 (2026-04-25 기준)

| 영역              | 우회 방법                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| 밴드 검색         | `useBandList` 의 모든 페이지를 펼쳐 클라이언트 `includes` 필터         |
| 내 소속 / 탐색 탭 | 동일 `useBandList` 결과를 두 탭이 공유, 향후 `memberOnly=true` 로 분리 |
| 합주 목록         | 405 차단 — 홈/리스트 패널이 빈 상태 (백엔드 GET /practices 시급)       |
| 합주곡 검색       | songId UUID 입력 폼 유지                                               |
| 프로필 사진       | URL 입력 텍스트 폼 유지 (업로드 미지원)                                |
| 알림              | 미구현                                                                 |

---

## 🔄 활성화 절차 (백엔드 구현 완료 시)

1. 위 항목 중 구현된 엔드포인트 명세를 `API_SPEC.md` 에 추가/업데이트.
2. 프론트 `domain/{name}/api/` 의 fetcher 시그니처를 새 query/필드에 맞춰 갱신.
3. `useDiscoverySearch` 등 mock 대체 hook 의 fetcher 만 교체 (UI 불변).
4. `.taskmaster/report/mvp-1-fix-integration-YYYY-MM-DD.md` 후속 검증 라운드를 실시해 mock 의존이 해소됐는지 확인.
