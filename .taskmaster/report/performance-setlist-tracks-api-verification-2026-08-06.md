## 검증 일시
2026-08-06

## 대상 API 목록
- `GET /api/v1/performances/{performanceId}/setlists/tracks` (공연 참여 셋리스트 트랙·참여자 전체 조회, 신규)

## 정상 응답 확인
- 실서버(`https://bandage.team`) 라이브 OpenAPI 스펙(`/api-docs`)에서 `getPerformanceSetlistTracks` 정의 확인. 응답은 페이징 없는 배열 `PerformanceSetlistTracksResponse[]`, 각 원소는 `{ setlist: SetlistResponse, tracks: SetlistTrackResponse[], participants: SetlistParticipantResponse[] }`.
- `ApiResponse<T>` 언래핑 결과 배열 형태를 그대로 `usePerformanceSetlistTracks` 훅의 반환 타입으로 사용.
- 기존에는 `PerformanceDetailContent`의 `SetlistCard`가 셋리스트별로 `useSetlistTracks(setlistId)`(`GET /setlists/{id}/tracks`)를 개별 호출 — 공연 OWNER/MANAGER가 본인이 참여하지 않은 셋리스트를 열람하면 403(SETLIST_FORBIDDEN)이 발생하던 버그. 이번 신규 API로 공연 단위 일괄 조회로 전환해 근본 해결.
- Playwright로 `PerformanceDetailContent`를 실제 렌더링, 셋리스트 2개(내 것 1개 + 남의 것 1개, 남의 것은 `/setlists/{id}/tracks` 호출 시 403을 반환하도록 목킹) 상황에서:
  - 개별 `/api/v1/setlists/{id}/tracks` 호출이 전혀 발생하지 않음을 확인 (호출 자체가 없어 403도 발생하지 않음)
  - 신규 `/api/v1/performances/perf-1/setlists/tracks` 벌크 호출 1회만 발생
  - 내 셋리스트 트랙("My Song")과 남의 셋리스트 트랙("Their Song") 모두 화면에 정상 표시됨을 확인

## 에러 케이스 확인
- 미실시. 실제 로그인 세션이 없어 인증된 실제 호출(401/403/404/5xx)은 수행하지 못함. 위 검증은 라이브 OpenAPI 계약 대조 + Playwright 네트워크 캡처/렌더링 확인으로 범위가 제한됨.

## 이슈 사항
- 없음. 기존 `SetlistDetail.client.tsx`(셋리스트 자체 상세 페이지)는 여전히 셋리스트 단위 `useSetlistTracks`를 사용 — 이 화면은 원래도 그 셋리스트에 접근 권한이 있는 사용자만 진입하므로 변경 불필요.
