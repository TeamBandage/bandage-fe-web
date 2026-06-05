## 검증 일시
2026-06-06

## 대상 API 목록
| # | 메서드 | 경로 | 설명 |
|---|--------|------|------|
| 1 | GET | `/api/v1/me/availability` | 내 가용성 조회 |
| 2 | PUT | `/api/v1/me/availability` | 내 가용성 등록/수정 |

프론트 호출 지점
- `src/domain/member/api/getMyAvailability.ts`
- `src/domain/member/api/updateMyAvailability.ts`

## 정상 응답 확인

### GET `/api/v1/me/availability`
- **미등록 시**: `{ weeklyRules: [], exceptions: [], note: null, updatedAt: null }` — 빈 배열 정상 반환 확인
- `ApiResponse<MemberAvailabilityResponse>` 언래핑 후 `data` 필드 정상 추출
- `useMyAvailability` 훅에서 `enabled: authenticated` 조건으로 미인증 시 호출 안 함

### PUT `/api/v1/me/availability`
- **미검증**: 아래 이슈 항목 참조

## 에러 케이스 확인
| 상태 코드 | 시나리오 | 처리 방식 |
|-----------|----------|-----------|
| 401 | 비인증 요청 | `apiClient` 인터셉터 → refresh 시도 → 실패 시 로그인 리다이렉트 |
| 400 `INVALID_INPUT_VALUE` | 요청 바디 역직렬화 실패 | toast.error 메시지 표시 (현재 이슈 대상) |
| 400 `AVAILABILITY_INVALID` | slot 범위 오류 (startSlot ≥ endSlot 등) | toast.error "가용성 정보가 올바르지 않습니다." |

## 이슈 사항

### [미해결] PUT 요청 시 400 `INVALID_INPUT_VALUE` 오류
- **현상**: 스케줄 입력 후 [완료] 클릭 시 "올바르지 않은 입력값입니다." 토스트 표시
- **원인 추정**: 백엔드 Jackson 설정에서 `LocalDate`를 timestamp 배열(`[2026, 6, 6]`) 형식으로 역직렬화 기대하는데, 프론트에서 ISO 문자열 `"2026-06-06"` 전송 → `MismatchedInputException`
- **영향 필드**: `weeklyRules[].effectiveFrom`, `weeklyRules[].effectiveTo`
- **재현 방법**: 로컬 백엔드(`http://localhost:8080`) 구동 → 스케줄 관리 모달 → 슬롯 선택 → 완료
- **해결 방안 (백엔드)**: `application.yaml`에 `spring.jackson.serialization.write-dates-as-timestamps: false` 추가, 또는 `WeeklyRuleRequest.effectiveFrom` 필드에 `@JsonFormat(pattern = "yyyy-MM-dd")` 어노테이션 추가
- **해결 방안 (프론트)**: `effectiveFrom`을 `[year, month, day]` 배열로 전송하도록 타입 및 변환 로직 수정 (백엔드 수정이 더 적절)
- **현재 상태**: 백엔드 수정 대기 중
