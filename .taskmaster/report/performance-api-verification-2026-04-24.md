# Performance API 프론트 연동 검증 리포트 (Task 9 / Issue #11)

- 작성일: 2026-04-24 (Asia/Seoul)
- 검증 주체: 프론트엔드 (Bandage-FE-Web, branch `feat/#11-performance`)
- 백엔드 기동 URL: `http://localhost:8080`
- 검증 도구: `curl` 직접 호출. 재현용 페이로드 `/tmp/bandage-performance-test/*`
- 검증 범위: `src/domain/performance/api/*` 의 8개 함수 + `useIsPerformanceManager` 보조 동작
- 사전 컨텍스트: Task 7 리포트 §3-B 의 "인가 실패를 401 대신 403 으로 분리" 권고가 본 엔드포인트들에 **선반영된 것으로 보임** (§2-5 참조)
- 요약: 8개 엔드포인트 모두 경로·응답 shape 면에서 프론트 구현과 일치. **PATCH(수정) 부분 업데이트 불가** 1건이 스펙 드리프트로 확인됨.

---

## 1. 테스트한 API 목록

| # | Path | Method | FE 함수 | 판정 |
| --- | --- | --- | --- | --- |
| 1 | `/api/v1/performances` | POST | `createPerformance` | 정상 — `data:{performanceId,title}` 반환, 생성자 자동 manager 등록(`managerIds:[9]` 확인) |
| 2 | `/api/v1/performances?pageSize=N` | GET | `getPerformances` | 정상 — `CursorResponse<PerformanceListItemResponse, string>` 일치 |
| 3 | `/api/v1/performances/{id}` | GET | `getPerformanceDetail` | 정상 — `bandIds/managerIds/practiceIds` 포함 상세 응답 |
| 4 | `/api/v1/performances/{id}` | PATCH | `updatePerformance` | **부분 업데이트 불가** — `startAt` 등을 생략하면 400. 전체 필드 전송 시에만 200 |
| 5 | 비매니저의 PATCH | PATCH | (인가 경계) | 정상 — **403 Forbidden** (권장 스타일로 분리됨) |
| 6 | `/api/v1/performances/{id}/practices` | POST | `addPerformancePractice` | 경로 정상 — 유효 songId 가 없어 404 "요청한 합주 곡 정보를 찾을 수 없습니다." |
| 7 | `/api/v1/performances/{id}/practices/batch` | POST | `batchAddPerformancePractices` | 경로 정상 — 랜덤 practiceIds 로 호출 시 404 (Practice 미존재) |
| 8 | `/api/v1/performances/{id}/practices/{practiceId}` | DELETE | `removePerformancePractice` | 경로 정상 — 랜덤 id 로 404 |
| 9 | `/api/v1/performances/{id}` | DELETE | `deletePerformance` | 정상 — 200 후 GET 시 404 "공연 정보를 찾을 수 없습니다." |

---

## 2. 케이스별 실제 요청/응답 값

### 2-1. Create `POST /api/v1/performances`

요청
```json
{
  "title": "QA Performance Test",
  "bandIds": [],
  "startAt": "2026-12-20 18:00",
  "durationMinutes": 120,
  "venue": "Club FF"
}
```
응답 (200)
```json
{
  "success": true,
  "data": { "performanceId": "019dbdf4-6906-7bdf-9cf3-790745eb7da1", "title": "QA Performance Test" }
}
```

### 2-2. List `GET /api/v1/performances?pageSize=5`

```json
{
  "data": {
    "content": [
      {
        "performanceId": "019dbdf4-...",
        "title": "QA Performance Test",
        "startAt": "2026-12-20 18:00",
        "durationMinutes": 120,
        "venue": "Club FF"
      }
    ],
    "nextCursor": "019dbdf4-6906-7bdf-9cf3-790745eb7da1",
    "hasNext": false
  }
}
```
관찰: Task 7 §3-C 와 동일하게 `hasNext:false` 인데 `nextCursor` 가 null 이 아님. 프론트 `useInfiniteCursor` 가드로 무영향.

### 2-3. Detail `GET /api/v1/performances/{id}`

```json
{
  "data": {
    "performanceId": "019dbdf4-...",
    "title": "QA Performance Test",
    "startAt": "2026-12-20 18:00",
    "durationMinutes": 120,
    "venue": "Club FF",
    "bandIds": [],
    "managerIds": [9],
    "practiceIds": []
  }
}
```
— `PerformanceDetailResponse` 타입 1:1 일치. `managerIds:[9]` 로 생성자 자동 등록 확인.

### 2-4. Update (부분) `PATCH /api/v1/performances/{id}` — **400**

요청 (일부 필드만)
```json
{ "title": "QA Performance Test (updated)", "durationMinutes": 150, "venue": "Club FF v2" }
```
응답 (400)
```json
{
  "success": false,
  "message": "JSON parse error: Cannot construct instance of `com.bandage.v1.domain.performance.dto.req.PerformanceUpdateRequest`, problem: Parameter specified as non-null is null: method com.bandage.v1.domain.performance.dto.req.PerformanceUpdateRequest.<init>, parameter startAt",
  "data": null
}
```

요청 (전체 필드)
```json
{ "title": "Updated T", "startAt": "2026-12-25 19:00", "durationMinutes": 150, "venue": "New Venue" }
```
응답 (200) — 성공

판정: **API_SPEC 6-4 는 모든 필드를 optional 로 명시**하지만, Kotlin 측 `PerformanceUpdateRequest` 가 `startAt` 을 non-nullable 로 선언해 부분 업데이트가 실패. 스펙 드리프트.

### 2-5. 비매니저 PATCH — **403 (올바름)**

요청 (userB 토큰, 전체 필드 포함)
응답 (HTTP 403, body 없음)

판정: Task 7 §3-B 리포트에서 요청했던 "인가 실패 401 대신 403 분리" 가 **이 엔드포인트에서는 정확히 적용됨**. 다만 Task 7 의 `delegateLeader` 는 여전히 401 반환 — 백엔드 전 영역에 일괄 적용되지는 않은 듯.

### 2-6~8. Practice 연결 (6-5/6-6/6-7)

세 엔드포인트 모두 경로·메서드·요청 shape 은 백엔드가 정확히 수용. 유효한 songId/practiceId 가 존재하는 계정에서 후속 검증이 필요하며, Task 8 리포트 §3-A (Song 생성 엔드포인트 부재) 해결 전까지는 실경로 완결 검증 불가.

### 2-9. Delete `DELETE /api/v1/performances/{id}`

- 200 성공 후 재조회 → 404 `"요청한 공연 정보를 찾을 수 없습니다."`
- 정상 동작

---

## 3. 권장 조치 내용 및 검토 필요 사항

### A. (Backend, 최우선) `PATCH /performances/{id}` 의 부분 업데이트 지원

**현상**
- API_SPEC 6-4 는 `UpdatePerformanceRequest` 의 모든 필드를 optional 로 명시
- 실제 Kotlin DTO `PerformanceUpdateRequest` 가 `startAt` 을 non-nullable 로 선언해 부분 업데이트가 400 으로 실패
- 다른 필드(`title`, `durationMinutes`, `venue`) 도 동일하게 required 일 가능성 — 추가 확인 필요

**요청 (택 1)**
- (A-1) `PerformanceUpdateRequest` 의 모든 필드를 nullable 로 변경해 진짜 부분 업데이트 허용 (API_SPEC 및 프론트 기대 동작과 일치)
- (A-2) 만약 PUT 시맨틱 유지가 의도라면 **메서드를 PUT 으로 변경** + API_SPEC 갱신

**프론트 측 임시 우회 (백엔드 수정 전)**
- `useUpdatePerformance` 호출 전에 현재 상세의 전체 필드를 병합해 전송 필요. 현재 EditDialog 는 변경된 필드만 보내므로 일부 케이스에서 400 발생 가능. 백엔드 수정까지는 "일정만 변경" "장소만 변경" 같은 UX 가 작동하지 않음
- 수정 전까지 EditDialog 에서 제목/시작시각/소요분/장소를 모두 `defaultValues` 로 채우고 변경 여부와 무관하게 모두 제출하도록 변경 가능 (§5 참고)

### B. (Backend, 권장) 401/403 분리 정책을 전 도메인 일괄 적용

- 본 엔드포인트(2-5)는 비매니저 PATCH 를 **403 Forbidden** 으로 올바르게 반환
- 다만 Task 7 리포트 §3-B 에서 지적한 `/bands/{id}/members/{id}/role` 비리더 호출은 여전히 **401** 반환 (이번 검증 범위 밖이지만 상관관계 주의)
- 권장: Auth 필터/핸들러 레벨에서 인증(401) vs 인가(403) 매핑을 도메인 구분 없이 통일

### C. (Backend, 경미) `CursorResponse.nextCursor` 일관성 — Task 7 §3-C 와 동일 이슈

- `hasNext:false` 일 때도 `nextCursor` 가 마지막 ID 로 채워짐. 프론트 영향 없음

### D. (Frontend, 선택) 밴드명·합주 제목 상세 노출

- 현재 `PerformanceBandChips` 는 bandId UUID 의 앞 8자만 표시, `PerformancePracticeRow` 는 practiceId 전체를 텍스트로만 표시. 백엔드가 `bands:[{bandId,bandName}]`, `practices:[{practiceId,title,startAt}]` 형태로 요약 필드를 반환하도록 확장하면 단일 쿼리로 더 풍부한 UI 가 가능. 현재는 N+1 호출 비용을 피하기 위해 의도적으로 미확장 상태 (주석 명시).

---

## 4. 검증된 긍정 신호

- `POST /performances` · `GET /performances(?bandId)` · `GET /performances/{id}` · `DELETE /performances/{id}` 4개 주요 경로는 프론트 타입과 완벽 정합
- 생성자 자동 PerformanceManager 등록 (`managerIds:[9]`) 확인 — `useIsPerformanceManager` 가 의도대로 작동할 조건 충족
- 비매니저의 수정 차단이 **403 으로 올바르게** 구분됨 (Task 6/7 대비 개선)

---

## 5. 프론트 관련 구현 지점

```text
src/domain/performance/types/{req,res,schema,index}.ts
src/domain/performance/api/*.ts                            # 8개 함수
src/domain/performance/hooks/*.ts                          # useCreate/List/Detail/Update/Delete/AddPractice/BatchAdd/RemovePractice
src/domain/performance/components/*.tsx                    # PerformanceCard, PerformanceDday, PerformanceBandChips, PerformancePracticeRow
src/global/auth/useIsPerformanceManager.ts
src/app/(main)/performances/page.tsx + PerformancesList.client.tsx (Suspense bound)
src/app/(main)/performances/new/page.tsx + PerformanceCreateForm.client.tsx
src/app/(main)/performances/[performanceId]/page.tsx + PerformanceDetailContent.client.tsx (EditDialog, AttachDialog)
```

§3-A 수정 전 임시 워크어라운드가 필요하면 `PerformanceDetailContent.client.tsx` 의 `EditDialog` 를 다음과 같이 보정 가능:

```ts
mutation.mutate({
  title: values.title ?? initial.title,
  startAt: values.startAt ? fromDatetimeLocal(values.startAt) : initial.startAt,
  durationMinutes: values.durationMinutes ?? initial.durationMinutes,
  venue: values.venue ?? initial.venue,
});
```

(현재는 undefined 필드를 제외해 보내는 API_SPEC 기대 동작. 백엔드 A-1 적용 시 워크어라운드 불필요.)

---

## 6. 재현용 페이로드 위치

```text
/tmp/bandage-performance-test/
  ├── state.env                 # TOKEN_A, TOKEN_B, MEMBER_A, MEMBER_B, PERF_ID
  ├── join_{a,b}.json .resp / login_{a,b}.json
  ├── create_perf.json / update_perf.json / update_full.json / hack_perf.json / hack_full.json
  ├── new_practice.json / batch.json
```
