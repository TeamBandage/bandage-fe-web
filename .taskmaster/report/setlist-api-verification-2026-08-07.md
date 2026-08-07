## 검증 일시
2026-08-07

## 대상 API 목록
- `DELETE /api/v1/setlists/{setlistId}` (`deleteSetlist`) — `src/domain/setlist/api/index.ts`

## 정상 응답 확인
- `http://localhost:8080` 로컬 백엔드는 기동 중이나, 앞단에 인증 게이트웨이(로그인 리다이렉트 페이지)가 붙어 있어 이번 세션에서 확보 가능한 인증 세션/토큰이 없음.
- 인증된 실제 호출 → 204/200 성공 → `ApiResponse<T>` 언래핑 결과 확인은 **수행하지 못함**.

## 에러 케이스 확인
- 인증 없이 `DELETE /api/v1/setlists/nonexistent-id` 호출 시 `403` + 로그인 리다이렉트 HTML 응답 확인 (백엔드가 아닌 게이트웨이 레벨 차단으로 추정, JSON `ApiResponse` 포맷 아님).
- 401/403(정상 인증 흐름)/404/400/5xx 각각의 백엔드 응답 포맷은 인증 세션 부재로 개별 확인 불가.

## 이슈 사항
- 실서버 인증 세션 확보 수단(테스트 계정/토큰)이 이번 세션 환경에 없어 §8 절차의 인증된 라운드트립 검증을 완료하지 못함. MCP `check_impacting_changes` 로 엔드포인트 존재(`endpoint-added`, non-breaking)만 확인했고, FE 구현은 동일 도메인의 기존 `deleteSetlistTrack`/`deleteScheduleBoard` 패턴을 그대로 따름.
- 후속: 인증 가능한 환경에서 실제 셋리스트 생성 → 삭제 → 목록 반영 확인 필요.
