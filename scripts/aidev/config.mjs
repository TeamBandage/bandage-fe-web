/**
 * Dev Agent 재실행 총횟수 상한.
 *
 * 실패 종류(자동 검사 실패 · Gemini 반려 · 사람 반려 · 자가 검증 실패)를 가리지 않고
 * 카운터 하나를 공유한다. 종류별로 상한을 나누면 합산 횟수가 곱절로 늘어나고, 서로 물고
 * 도는 핑퐁(테스트 고치면 리뷰가 깨지고, 리뷰 고치면 테스트가 깨지는)에서는 각 카운터가
 * 천천히 올라 상한이 제구실을 못 한다.
 *
 * 최초 1회 + 재시도 MAX_RETRY회 = 태스크당 `claude -p` 호출 상한.
 * dev-agent.mjs와 watch-review.mjs가 같은 값을 봐야 하므로 여기 한 곳에만 둔다.
 */
export const MAX_RETRY = 5;

/**
 * gate-d2가 "코드 판정"이 아니라 "리뷰 실행 자체"에 실패했을 때 PR 코멘트에 남기는 마커.
 * gemini-review.mjs가 쓰고 watch-review.mjs가 읽어, API 오류로 재시도 카운터를 소모하지 않게 한다.
 */
export const GATE_ERROR_MARKER = '<!-- aidev-gate-error -->';
