<context>
# Overview
BD-66 마이페이지 주간 타임테이블. 마이페이지 프로필 정보 섹션 하단에 주간 타임테이블을 추가한다. 사용자는 자신의 가용 시간대를 등록하고, 합주·공연 일정이 타임테이블에 시각적으로 표시된다.

핵심 출처
- 사용자 제공 와이어프레임 이미지 (2026-06-06): 주간 타임테이블, 나의 스케줄 관리 모달(1/2·2/2)
- 백엔드 API: `GET/PUT /api/v1/me/availability` (bandage-band-manager)
- 기존 구현: `src/app/(main)/me/MeContent.client.tsx`

# Goals
1. **주간 타임테이블 표시**: 9:00~22:00, 30분 단위 그리드. 가능 시간 = 빈 셀, 불가 시간 = 회색 블록, 합주 = 노란색, 공연 = 초록색 이벤트 블록.
2. **나의 스케줄 관리 모달**: 2단계 플로우 — Step 1 드래그/클릭으로 가능 시간 선택 → Step 2 특이사항 입력 → `PUT /api/v1/me/availability` 저장.
3. **주간 날짜 범위 표기**: `2026-04-20 (월) ~ 04-26 (일)` 형식으로 현재 주 표시.

# Non-goals
- 타 멤버의 가용성 조회 (밴드 스케줄 조율은 별도 도메인)
- 주간 이동(이전 주·다음 주) 탐색 — 항상 현재 주 고정
- 예외(exception) 규칙 설정 UI — weeklyRules만 지원

# Audience & UX context
- 다크 테마 고정
- 모바일(360px~) / 데스크톱(lg 960px+) 동시 지원
- 모달 배경 bg-black/50 오버레이, 내부 최대 높이 90vh 스크롤

# Existing architecture (재사용 대상)
- `src/app/(main)/me/MeContent.client.tsx` — 타임테이블 섹션 삽입 지점
- `src/domain/practice/hooks/useMyPractices.ts` — 합주 이벤트 데이터
- `src/domain/performance/hooks/useMyPerformances.ts` — 공연 이벤트 데이터
- `src/global/api/apiClient.ts` — HTTP 클라이언트 (GET/PUT 지원)
- `src/lib/date.ts` — KST 날짜 헬퍼
</context>
<PRD>
# Scope

## Task 1 — 주간 타임테이블 UI 구현

### 1.1 Availability 관련 타입 정의
- `domain/member/types/res.ts`: `MemberAvailabilityResponse`, `WeeklyRuleResponse`, `AvailabilityExceptionResponse`, `AvailabilityKind`, `DayOfWeek`
- `domain/member/types/req.ts`: `UpdateMyAvailabilityRequest`, `WeeklyRuleRequest`, `AvailabilityExceptionRequest`
- slot 체계: 30분 단위, slot 0=00:00, slot 18=09:00, `[startSlot, endSlot)` 반열린 구간

### 1.2 API 함수
- `domain/member/api/getMyAvailability.ts` — `GET /api/v1/me/availability`
- `domain/member/api/updateMyAvailability.ts` — `PUT /api/v1/me/availability`

### 1.3 TanStack Query 훅
- `useMyAvailability` — GET, staleTime 5분, authenticated guard
- `useUpdateMyAvailability` — mutation, 성공 시 `setQueryData` 낙관적 업데이트

### 1.4 WeeklyTimetable 컴포넌트
- `domain/member/components/WeeklyTimetable.client.tsx`
- 9:00(slot 18)~22:00(slot 44) 표시 범위, CELL_HEIGHT=20px
- 불가 시간대: `weeklyRules` 미적용 슬롯 → `bg-surface/70` 회색 블록 (연속 병합)
- 이벤트 블록: 합주 `bg-[#e8e8c0]` / 공연 `bg-[#7a9e8c]`, 절대 위치 오버레이
- 헤더: 주간 날짜 범위 + [나의 스케줄 관리] 버튼

### 1.5 ScheduleManagerModal 컴포넌트
- `domain/member/components/ScheduleManagerModal.client.tsx`
- Step 1/2: 드래그/클릭 가능 시간 선택 그리드 (coral `#e8856a`), [스케줄 초기화], [다음](슬롯 ≥1 활성화)
- Step 2/2: 특이사항 textarea (최대 500자), [완료]
- 기존 가용성 → `availabilityToGrid`로 초기화, 저장 시 `gridToWeeklyRules` 변환 후 PUT

### 1.6 MeContent 통합
- 프로필 섹션 하단에 `<WeeklyTimetable>` 섹션 추가 (`!isEditing` 조건)
- `useMyPractices(100)` · `useMyPerformances(100)` · `useMyAvailability` 데이터 주입
- `ScheduleManagerModal` 마운트, `useUpdateMyAvailability` 연동

## Task 2 — UI 수정

### 2.1 상단 여백
- `WeeklyTimetable` `<section>` → `mt-15` (60px) 추가

### 2.2 시간 레이블 정렬
- 기존 `-top-2` offset 제거 → `translateY(-50%)` 적용으로 그리드 라인과 수직 중앙 정렬

### 2.3 PC 세로 스크롤
- `src/app/(main)/layout.tsx` `<main>` 요소: `overflow-hidden` → `overflow-y-auto`
- Shell이 `h-screen overflow-hidden`이므로 main이 overflow-hidden이면 클리핑 발생

### 2.4 ScheduleManagerModal 스크롤
- 카드 div에 `max-h-[90vh] overflow-y-auto` 적용 — 저화면에서 그리드 스크롤 가능

# Known Issues
- `PUT /api/v1/me/availability` 요청 시 `effectiveFrom` 필드 Jackson 역직렬화 오류 (`MismatchedInputException`) 발생 가능. 백엔드에 `spring.jackson.serialization.write-dates-as-timestamps: false` 설정 또는 `@JsonFormat` 어노테이션 추가 필요. → **BD-66 미해결 이슈**

# Test Strategy
- 가용성 미등록 상태: 타임테이블 전체 회색 (weeklyRules=[])
- 가용성 등록 후: 가능 시간 빈 셀, 불가 시간 회색
- 합주/공연 있는 주: 이벤트 블록 표시 (날짜 매칭)
- 모달 Step 1: 드래그로 여러 셀 선택 → 다음 활성화, 초기화 → 전체 해제
- 모달 Step 2: 특이사항 입력 → 완료 → 토스트 성공
- PC(lg+): 타임테이블 아래로 스크롤 가능, 모달 긴 내용 스크롤 가능
- 모바일: 동일 기능 동작
</PRD>
