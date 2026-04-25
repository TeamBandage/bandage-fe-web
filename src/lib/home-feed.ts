/**
 * 홈 화면 섹션의 임시 정렬/필터 유틸.
 * 백엔드의 정식 home/feed 엔드포인트가 도입되기 전까지 클라이언트에서 적용.
 *
 * 추후 API_REQUIRED FE-API-019 (홈 피드 우선순위 정렬) 가 추가되면 본 유틸 제거 예정.
 */

interface HasStartAt {
  startAt: string;
}

/**
 * `startAt >= now` 인 항목만 startAt 오름차순 정렬 후 상위 `limit` 건 반환.
 * 결과 + 더 많은 항목 존재 여부(`hasMore`) 도 함께 노출.
 *
 * @param items 입력 항목 (startAt 은 ISO 또는 'yyyy-MM-dd HH:mm' Asia/Seoul 가정)
 * @param limit 최대 노출 개수
 * @param now Date 인스턴스 (테스트 가능성 — 기본 Date.now)
 */
export function pickUpcoming<T extends HasStartAt>(
  items: T[],
  limit: number,
  now: Date = new Date(),
): { items: T[]; hasMore: boolean } {
  const ts = now.getTime();
  const upcoming = items
    .filter((it) => {
      const t = Date.parse(it.startAt.replace(' ', 'T') + ':00+09:00');
      // 파싱 실패(NaN) 인 경우 보수적으로 포함.
      return Number.isNaN(t) ? true : t >= ts;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  return {
    items: upcoming.slice(0, limit),
    hasMore: upcoming.length > limit,
  };
}

/** 단순 슬라이스 + hasMore 노출. (밴드 목록처럼 startAt 이 없는 항목용) */
export function takeTop<T>(items: T[], limit: number): { items: T[]; hasMore: boolean } {
  return {
    items: items.slice(0, limit),
    hasMore: items.length > limit,
  };
}
