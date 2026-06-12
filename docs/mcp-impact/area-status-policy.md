# 영역 상태(status) 정책 — mock/미연동 영역 영향 조회 처리

`fe-areas.json`의 각 영역은 `status` 필드로 BE 연동 성숙도를 표기한다.
`check_impacting_changes` 가 영역을 조회할 때 이 값에 따라 결과를 다르게 해석한다.

## status 값

| status         | 의미                                      | 영향 조회 동작                                                                    |
| -------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `active`       | endpoint가 BE에 정상 연동됨               | 정상 영향 평가. breaking 변경을 영역에 매핑해 보고                                |
| `partial-mock` | 일부 화면이 mock 데이터와 병존(부분 연동) | 연동 endpoint는 정상 평가하되, 결과에 "이 영역은 일부 mock 병존" 경고를 함께 표시 |
| `mock-only`    | BE 미연동(전량 mock, endpoint 매핑 없음)  | 영향 조회 대상에서 제외. 호출 시 "미연동 영역 — 평가 불가" 안내 반환              |

## 현재 영역별 적용

- `active`: auth, member, band, practice, performance
- `partial-mock`: **setlist-meeting**
  - `src/domain/setlist-meeting/mock` 의 mock 데이터가 일부 화면에서 실 API와 병존.
  - `/api/v1/setlist-meetings/*` 연동분은 정상 평가하되, mock 구간 변경은 BE diff로 잡히지 않음을 주의.
- `mock-only`: **schedule-coordination**
  - `api/` 폴더 자체가 없고 `src/domain/schedule-coordination/mock` 으로만 동작.
  - `endpointPrefixes`가 비어 있어 어떤 BE 변경에도 매핑되지 않음 → 조회 시 "미연동" 처리.

## 운영 원칙

1. **오탐 방지**: mock-only 영역을 active처럼 취급하면 "영향 없음"이 "안전함"으로 오인된다.
   미연동임을 명시적으로 구분한다.
2. **연동 승격 시 갱신 의무**: mock → 실 API 전환 시 같은 PR에서 `status`를 `active`로
   올리고 `endpointPrefixes`를 채운다. `pnpm verify:fe-areas` 로 누락을 검증한다.
3. **partial-mock 가시화**: 부분 연동 영역은 결과에 경고를 남겨, FE 작업자가 mock 구간을
   별도로 점검하도록 유도한다.
