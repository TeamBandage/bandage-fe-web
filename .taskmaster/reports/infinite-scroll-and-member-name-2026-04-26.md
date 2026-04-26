# 무한 스크롤 / 멤버 이름 표시 분석 (mvp-1-fix-v4 Task 8 7-2/7-3)

작성일: 2026-04-26
작성: AI Agent (Claude Sonnet 4.6)

## 1. 멤버 이름 "멤버 #2718" 표시 원인

### 근본 원인 — **백엔드 미지원**

API_SPEC §3-4 / §3-5 의 `BandMemberInfoResponse` 가 다음 3 필드만 노출:

```json
{
  "bandMemberId": "...",
  "memberId": 1,
  "role": "MEMBER"
}
```

`name` 필드가 응답에 포함되지 않음. mvp-1-fix-v3 Task 8 (`.taskmaster/reports/create-api-verification-2026-04-26.md`) 의 실서버 검증에서도 동일 결과 확인됨.

### 프론트 동작

`src/domain/member/utils/getMemberDisplayName.ts` 의 폴백 룰:
- `name` 이 truthy 한 경우 → 그대로 표시
- 그렇지 않으면 → `'멤버 #' + memberId.slice(-4)`

따라서 백엔드가 name 미지원인 한, "멤버 #2718" 처럼 표시됨.

### 액션

- **이미 등록됨**: `API_REQUIRED.md` FE-API-012 (`BandMemberInfoResponse` 에 `name`/`profileImg` 추가)
- 백엔드가 응답에 `name` 을 추가하면 본 폴백은 자동 비활성, 실제 이름이 표시됨
- 프론트 코드 수정 불필요

## 2. 무한 스크롤 동작 검증

### 정상 동작 (IntersectionObserver 트리거)

- `src/app/(main)/bands/BandsList.client.tsx` — 메인 페이지의 밴드 목록
- `src/app/(main)/performances/PerformancesList.client.tsx` — 메인 페이지의 공연 목록

위 두 컴포넌트는 `loadMoreRef` 를 사용해 IntersectionObserver 가 viewport 진입을 감지하고 `fetchNextPage()` 호출. `hasNextPage=true` 이고 `isFetchingNextPage=false` 일 때만 발화.

### 부분 동작 (수동 버튼)

- `src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx` — 멤버 / 신청 목록 — 버튼 트리거 (`fetchNextPage()` 직접 호출). UX 상 문제 없음.

### **이슈 — 사이드 패널은 첫 페이지만 노출**

- `src/app/(main)/bands/BandsListPane.client.tsx`
- `src/app/(main)/practices/PracticesListPane.client.tsx`
- `src/app/(main)/performances/PerformancesListPane.client.tsx`

위 3 패널은 `useMyBands` / `useMyPractices` / `useMyPerformances` (또는 `useBandList`) 의 `data?.pages.flatMap((p) => p.content)` 만 사용. **`fetchNextPage` 호출 없음** — 결과적으로 첫 페이지(20건) 만 표시되고 그 이후는 영원히 가려짐.

판정: **기능 저하 (P1)**. 사용자가 21번째 항목을 보려면 데스크톱에서는 메인 페이지로 이동해야 함.

### 권장 후속 조치

각 ListPane 의 ListContent 끝에 IntersectionObserver 트리거 div 를 추가:

```tsx
const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyBands(20);
const loadMoreRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!hasNextPage || !loadMoreRef.current) return;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
  });
  observer.observe(loadMoreRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// ... 리스트 렌더 끝에:
{hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
```

본 라운드 범위 외 — mvp-1-fix-v5 또는 별도 PR 로 처리 권고. 단, `useMyBands` 는 현재 `useQuery` 기반이라 `hasNextPage`/`fetchNextPage` 를 반환하지 않음 — `useInfiniteCursor` 로 전환 필요. 이는 cascade 영향이 있으므로 별도 라운드 적합.

## 3. 종합 판정

| 항목 | 상태 | 우선순위 | 후속 |
|---|---|---|---|
| 멤버 이름 미표시 | 백엔드 원인 (FE-API-012) | P1 | 백엔드 응답에 name 추가 시 자동 해소 |
| 메인 리스트 무한 스크롤 | 정상 | — | — |
| 사이드 패널 무한 스크롤 | 부재 — 첫 페이지만 노출 | P1 | mvp-1-fix-v5 라운드에서 useInfiniteCursor 전환 + IntersectionObserver 적용 |
| BandDetailContent 멤버 페이징 | 버튼 트리거 정상 | — | — |
