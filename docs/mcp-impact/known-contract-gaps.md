# 알려진 계약 불일치 (known contract gaps) — 개발자 인계용

FE 호출 코드와 BE 최신 스펙(`openapi/openapi.json` @ develop, source of truth)이 어긋나는
지점을 **기록만** 한 문서다. 이 문서는 코드를 고치지 않는다 — 실제 호출 경로/payload 정렬은
개발자가 진행한다(범위 밖).

- 출처 스펙: https://raw.githubusercontent.com/TeamBandage/bandage-band-manager/develop/docs/openapi.json
- 검출 경위: `pnpm verify:fe-areas` 의 known-gap 분류 + jam 스키마 ↔ FE practice DTO 수기 대조
- 용도: MCP 영향평가 Tool 가동 시 출력과 대조해 Tool 정확도를 역검증하는 기준선

> createBand 의 `memberId` 는 인증 파생값으로 FE 미전달이 정답 → **불일치 아님, 등재 제외**.
> `/api/v1/members/me/stats` 는 주석 내 참조일 뿐 실제 호출 아님(실호출은 `/members/me/metrics`,
> 스펙 존재) → 등재 제외.

---

## GAP-1. practice → jam 도메인 재구조화 (BD-70)

[상태: 미정렬 / 사유: 개발자 코드 정렬 영역 / 우선순위: **높음(런타임 영향 가능)**]

BE는 `/api/v1/practices/*` 를 폐기하고 `/api/v1/jams/*` 로 재구조화했다(단순 리네임 아님).
FE `src/domain/practice` 는 여전히 폐기된 practices 경로를 호출 중이다. **현재 런타임에서
이미 실패하고 있을 수 있다.**

### 1-1. endpoint 경로 매핑 (FE 호출 → BE operationId)

| FE 파일                | FE 호출(폐기)                                  | BE operationId   | BE 경로                                  | 비고                    |
| ---------------------- | ---------------------------------------------- | ---------------- | ---------------------------------------- | ----------------------- |
| `createPractice.ts`    | POST `/api/v1/practices`                       | `createJam`      | POST `/api/v1/jams`                      | payload 대변경(1-2)     |
| `getPractice.ts`       | GET `/api/v1/practices/{id}`                   | `getJam`         | GET `/api/v1/jams/{jamId}`               | 응답 대변경(1-3)        |
| `getPractices.ts`      | GET `/api/v1/practices`                        | `getJams`        | GET `/api/v1/jams`                       | 목록 응답 변경          |
| `getMyPractices.ts`    | GET `/api/v1/practices/me`                     | `getMyJams`      | GET `/api/v1/jams/me`                    |                         |
| `searchMyPractices.ts` | GET `/api/v1/practices/me/search`              | `searchMyJams`   | GET `/api/v1/jams/me/search`             |                         |
| `deletePractice.ts`    | DELETE `/api/v1/practices/{id}`                | `deleteJam`      | DELETE `/api/v1/jams/{jamId}`            | 경로만                  |
| `updateSchedule.ts`    | PATCH `/api/v1/practices/{id}/schedule`        | `updateTimeInfo` | PATCH `/api/v1/jams/{jamId}/time-info`   | 경로+이름, payload 동일 |
| `updateVenue.ts`       | PATCH `/api/v1/practices/{id}/venue`           | `updateVenue`    | PATCH `/api/v1/jams/{jamId}/venue`       | 경로만, payload 동일    |
| `addParticipant.ts`    | POST `/api/v1/practices/{id}/participants`     | `addParticipant` | POST `/api/v1/jams/{jamId}/participants` | payload 변경(1-4)       |
| `createSession.ts`     | POST `/api/v1/practices/{id}/sessions`         | (직접 대응 없음) | PUT `/api/v1/jams/{jamId}/sessions`      | 세션 모델 변경(1-5)     |
| `deleteSession.ts`     | DELETE `/api/v1/practices/{id}/sessions/{sid}` | (직접 대응 없음) | PUT `/api/v1/jams/{jamId}/sessions`      | 일괄 교체 모델          |
| `assignSession.ts`     | PATCH `.../sessions/{sid}/assignment`          | (직접 대응 없음) | `addParticipant`(sessionId 포함)         | 배정 모델 변경(1-4,1-5) |
| `unassignSession.ts`   | DELETE `.../sessions/{sid}/assignment`         | (직접 대응 없음) | `deleteParticipant`                      | 배정 모델 변경          |

BE 신규(미대응): `createJamsFromSetlist` (POST `/api/v1/setlists/{setlistId}/jams`) — 셋리스트 경유 jam 일괄 생성. FE 미구현.

### 1-2. 생성 요청 payload — `CreatePracticeRequest` → `JamCreateRequest`

| FE `CreatePracticeRequest`                    | BE `JamCreateRequest`              | 차이                                                                                |
| --------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `song: string`                                | `track: TrackInfoRequest`          | **곡이 문자열 → 구조화 객체**. `{ *title, *artist, album?, duration?, reference? }` |
| (없음)                                        | `sessions: SessionDefDto[]` (필수) | 생성 시 세션 정의 필수. FE는 생성 후 별도 추가 모델                                 |
| (없음)                                        | `note?: string`                    | 신규                                                                                |
| `title?` `venue?` `startAt` `durationMinutes` | 동일 키 존재                       | 호환                                                                                |

응답: FE `CreatePracticeResponse { practiceId, practiceTitle }` → BE `JamResponse { jamId, jamTitle }` (필드명 변경).

### 1-3. 상세 응답 — `PracticeDetailResponse` → `JamDetailResponse`

| FE                                                          | BE                                                                    | 차이                                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `practiceId`                                                | `jamId`                                                               | 필드명                                                              |
| `song: PracticeSongResponse {songId,title,artist,refLink?}` | `track: TrackInfoResponse {title,artist,album?,duration?,reference?}` | 구조 변경: `refLink→reference`, `+album`,`+duration`, `songId` 없음 |
| (없음)                                                      | `setlistId?`, `note?`                                                 | 신규                                                                |
| `sessions: PracticeSessionResponse[]`                       | `sessions: JamSessionResponse[]`                                      | 세션 모델 변경(1-5)                                                 |
| `participants: PracticeParticipantResponse[]`               | `participants: JamParticipantResponse[]`                              | 참가자 모델 변경(1-4)                                               |

### 1-4. 참가자 모델

| FE `PracticeParticipantResponse`     | BE `JamParticipantResponse`                    | 차이                                                             |
| ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------- |
| `participantId`, `memberId`, `name?` | `participantId`, `memberId`, `sessionId`(필수) | **`sessionId` 필수 추가**(참가자가 세션에 종속). FE `name?` 없음 |

요청: FE `AddParticipantRequest { memberId }` → BE `JamMemberAddRequest { memberId, sessionId }`. **`sessionId` 필수**.

### 1-5. 세션 모델 (가장 큰 변화)

| FE `PracticeSessionResponse`                    | BE `JamSessionResponse`                                                         | 차이                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `sessionId`, `label`, `type: SessionType`(enum) | `sessionId`, `label`, `short`, `need:int`, `custom:bool`, `participants: int[]` | `type` 제거 → `short/need/custom` 도입. **참가자 1:1(`participant\|null`) → N:M(`participants: memberId[]`)** |

- 세션 CRUD 모델 변경: 개별 생성/삭제/배정(`POST/DELETE .../sessions/{sid}`, `.../assignment`) →
  **일괄 교체** `PUT /api/v1/jams/{jamId}/sessions` (`JamSessionsUpdateRequest { sessions: SessionDefDto[] }`,
  `SessionDefDto { sessionId, label, short, need, custom }`).
- FE의 `CreateSessionRequest { label, type }`, assignment 개념은 BE에 직접 대응이 없음.

---

## GAP-2. practice-song 도메인 폐기 (BD-70)

[상태: 미정렬 / 사유: 개발자 코드 정렬 영역 / 우선순위: **높음**]

BE는 `PracticeSong` 도메인을 제거하고 곡 정보를 jam 에 `track`(TrackInfo)로 임베디드했다.
스펙에 `/api/v1/practice-songs/*` 경로가 **전혀 없다**. FE `src/domain/practice-song` 전체가
폐기 경로를 호출 중이다.

| FE 파일                           | FE 호출(폐기)                                 | BE 대체                           | 비고                                              |
| --------------------------------- | --------------------------------------------- | --------------------------------- | ------------------------------------------------- |
| `createPracticeSongFromFields.ts` | POST `/api/v1/practice-songs`                 | `JamCreateRequest.track` 임베디드 | 별도 곡 생성 개념 제거                            |
| `createPracticeSongFromSong.ts`   | POST `/api/v1/practice-songs/from-song`       | 동상                              |                                                   |
| `upsertRefLink.ts`                | PUT `/api/v1/practice-songs/{id}/ref-link`    | `track.reference` 필드            | refLink → track.reference 흡수                    |
| `deleteRefLink.ts`                | DELETE `/api/v1/practice-songs/{id}/ref-link` | 동상                              |                                                   |
| `searchSongs.ts`                  | GET `/api/v1/practice-songs/search`           | **대체 미확인**                   | jam 오퍼레이션에 곡 검색 대응 없음 → BE 확인 필요 |

> **BE 확인 필요**: 곡 검색(`searchSongs`)의 대체 endpoint가 jam 재구조화 후 어디로 갔는지
> 불명확하다(track 임베디드만으로는 검색 UI를 대체하지 못함). 별도 확인 요망.

---

## 정렬 가이드(개발자용 요약)

1. `src/domain/practice` → jam 경로(`/api/v1/jams/*`)로 이전 + DTO를 jam 스키마로 재매핑
   (song→track, 세션/참가자 모델 변경 반영). operationId 기준은 `fe-areas.json` 의 jam 영역 참조.
2. `src/domain/practice-song` 제거 또는 track 임베디드 흐름으로 흡수. 곡 검색은 BE 확인 후 결정.
3. 정렬 완료 시 `fe-areas.json` 의 `knownGaps` 에서 해당 prefix 제거 → `pnpm verify:fe-areas`
   가 jam 영역을 covered 로 인식하고 known-gap 항목이 사라진다.
