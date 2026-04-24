# Task ID: 11

**Title:** 날짜·시간 입력 UI 현대화 (달력/스크롤 피커)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 공연·합주 생성/수정 폼의 시작시각·duration 같은 날짜·시간 입력을 원시 number/text 대신 달력 팝오버 + 시간 피커 조합으로 교체한다.

**Details:**

1) 공용 컴포넌트 DateTimePicker 구현 (src/components/ui/date-time-picker.tsx): Calendar 팝오버 + 시간 스크롤(Hour/Minute 24h). radix-popover 기반. 2) date-fns-tz 로 Asia/Seoul 유지, lib/date.ts 의 formatKst/parseKst 를 그대로 활용. 3) Dialog (모바일) / Popover (데스크톱) 자동 전환은 ResponsiveSheet 패턴과 유사하게. 4) Practice 생성 폼(PracticeCreateForm)과 Performance 생성 폼 모두에 교체 적용, 기존 Input[type=datetime-local] 제거. 5) Vitest 렌더 + 특정 datetime 선택 시 hidden input 값이 yyyy-MM-dd HH:mm 형식 문자열이 되는지 검증.

**Test Strategy:**

No test strategy provided.
