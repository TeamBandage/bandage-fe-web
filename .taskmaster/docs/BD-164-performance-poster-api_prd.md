<context>
# Overview
BD-164 공연 포스터 관련 API FE 도메인 구현. BE develop 브랜치에 6개 엔드포인트가 추가됐으나 openapi.json 스냅샷에 미반영된 상태였으며, MCP `check_impacting_changes(fe_area="performance-poster")` 로 6개 엔드포인트를 확인한 뒤 FE 도메인을 구현했다.

핵심 출처
- MCP 영향평가: `performance-poster` 영역 — 6개 endpoint-added (INFO, non-breaking)
- 참조 패턴: `src/global/upload/presignProfileImage.ts` (presigned URL 패턴)
- fe-areas.json: `performance-poster` 영역 `specPending: true` 상태로 사전 등록됨 (BD-93 작업 시)

# Goals
1. MCP로 확인된 6개 엔드포인트에 대한 FE API 함수 구현
2. TanStack Query 래퍼 훅(useQuery/useMutation) 구현
3. `queryKeys.performancePoster` 추가
4. fe-areas.json notes 업데이트 (MCP 확인 완료 기록)

# Non-goals
- 공연 포스터 UI 컴포넌트 구현 (별도 태스크)
- openapi.json 스냅샷 업데이트 (BE 머지 후 진행)
- 실서버 검증 (openapi.json 미반영으로 로컬 BE 확인 필요)

# Existing architecture (재사용 대상)
- `src/global/api/apiClient.ts` — fetch 클라이언트
- `src/global/upload/presignProfileImage.ts` — presigned URL 패턴 참조
- `src/global/config/queryKeys.ts` — 쿼리 키 관리
</context>
<PRD>
# Scope

## Task 1 — 공연 포스터 도메인 구현

### 1.1 타입 정의
- `types/res.ts`
  - `PerformancePosterResponse` — `{ posterId, performanceId, imageUrl, description, createdAt, updatedAt }`
  - `PerformancePosterPresignResponse` — `{ uploadUrl, objectKey, expiresInSeconds }`
- `types/req.ts`
  - `PerformancePosterPresignRequest` — `{ contentType, contentLength, ext }`
  - `CreatePerformancePosterRequest` — `{ performanceId, objectKey, description? }`
  - `UpdatePerformancePosterRequest` — `{ description }`
- `types/index.ts` — 전체 re-export

### 1.2 API 함수 (6개)
| 함수 | 엔드포인트 | operationId |
|---|---|---|
| `issuePerformancePosterPresignedUrl` | `POST /api/v1/performance-posters/presigned-url` | issuePerformancePosterPresignedUrl |
| `getPerformancePosters` | `GET /api/v1/performance-posters?performanceId=` | getPerformancePosters |
| `createPerformancePoster` | `POST /api/v1/performance-posters` | createPerformancePoster |
| `getPerformancePoster` | `GET /api/v1/performance-posters/{posterId}` | getPerformancePoster |
| `updatePerformancePoster` | `PATCH /api/v1/performance-posters/{posterId}` | updatePerformancePoster |
| `deletePerformancePoster` | `DELETE /api/v1/performance-posters/{posterId}` | deletePerformancePoster |

### 1.3 훅
- `usePerformancePosters(performanceId)` — `useQuery`, `queryKeys.performancePoster.list(performanceId)`
- `useCreatePerformancePoster(performanceId)` — `useMutation`, 성공 시 list 캐시 무효화
- `useUpdatePerformancePoster(performanceId, posterId)` — `useMutation`, 성공 시 list 캐시 무효화
- `useDeletePerformancePoster(performanceId)` — `useMutation`, 성공 시 list 캐시 무효화

### 1.4 queryKeys 추가
```ts
performancePoster: {
  all: ['performance-poster'],
  list: (performanceId) => ['performance-poster', performanceId],
  detail: (posterId) => ['performance-poster', 'detail', posterId],
}
```

### 1.5 fe-areas.json
- `performance-poster` 영역 notes 업데이트: MCP 확인 완료(6개 엔드포인트) 기록
- `specPending: true` 유지 (openapi.json 스냅샷 미반영)

# Test Strategy
- `pnpm typecheck` — 0 errors
- `pnpm verify:fe-areas` — ✅ PASS
- MCP `check_impacting_changes(fe_area="performance-poster")` — 6개 INFO 확인
- openapi.json 업데이트 후 req/res 타입 스펙과 대조 검증 필요
</PRD>
