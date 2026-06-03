# 합주 일정 조율 PRD

작성일: 2026-04-26
영향 도메인: 신규 `domain/schedule-coordination`, 기존 `domain/setlist-meeting`
선행 라운드: setlist-phase2 (회의 만들기 마법사)

## 0. 배경 / 목적
선곡 확정 후, 참여 멤버들의 가용 일정을 모아 최적 합주 시간을 잡는 기능이 부재. 본 라운드는 멤버 스케줄 수집 → 종합 → 매니저 확정의 풀 플로우를 도입한다. when2meet 패턴을 Bandage 디자인 토큰으로 재구성.

## 1. 범위 요약
0. **마법사 Step 3 확장**: 회의 정보 단계에 '합주 기간' 입력 추가. 공연 모드는 오늘~공연 일자 자동, 사용자 수정 가능. 일반 모드는 사용자 직접 입력.
1. **신규 서브탭 '합주 일정 조율'**: `/scheduling`
   - 사이드바 sub: 합주 일정 조율
   - 마스터 사이드바(오버레이) — 선곡 회의 목록 (기존 패널 재사용 / 동일 동작)
   - 회의 선택 → 사이드바 자동 닫힘 + 메인 화면 진입
   - 메인: 좌/우 절반 — 좌측 멤버 리스트, 우측 확정 곡 리스트
   - 언더라인 탭: 내 합주곡만 / 전체 보기
   - '나의 스케줄 입력' 버튼 → 5-Step 모달 (캐싱)
   - 멤버 행 클릭 → 우측 패널 열림(개인 일정 시각화)
   - 곡 행 클릭 → 우측 패널 열림(이 곡 가능한 시간/멤버 매트릭스)
   - 매니저: '합주 일정 확정' 액션 + 최적 시간표 추천

## 2. 사용자 시나리오

### 2-1. 마법사 Step 3 합주 기간 입력
- 공연 모드 진입 시 합주 기간 자동 = 오늘 ~ 공연 startAt 일자.
- 일반 모드 진입 시 빈 값 → 사용자가 'YYYY-MM-DD ~ YYYY-MM-DD' 두 input 으로 직접 입력.
- 두 모드 모두 사용자 수정 가능. 검증: from <= to.
- store.addMeeting 시 `practiceWindow: { from, to }` 로 저장.

### 2-2. 합주 일정 조율 진입
- 사이드바 '선곡 회의 > 합주 일정 조율' 클릭 → `/setlist-meetings/scheduling`
- 좌측 마스터 패널 자동 펼침(오버레이) — 회의 목록.
- 회의 클릭 → `/setlist-meetings/scheduling/{meetingId}` + 패널 자동 닫힘.

### 2-3. 메인 화면
- 상단 헤더: 회의 제목, 합주 기간, 매니저, '나의 스케줄 입력' 버튼.
- 두 패널 (md 이상 좌우 분할, 모바일 세로):
  - **좌측: 멤버 리스트** — 참여 멤버 N명, 각자의 입력 진행 상태(미입력 / 부분 / 완료) 배지. 클릭 → 우측 상세.
  - **우측: 곡 리스트** — 확정된 곡(`isReady=true` 또는 잠금된 회의의 모든 곡). 곡 클릭 → '이 곡 합주 가능한 시간' 매트릭스 표시.
- 언더라인 탭: '내 합주곡만 / 전체 보기' — 곡 리스트 필터.
- 매니저면 헤더에 success 톤 '합주 일정 확정' 버튼.

### 2-4. 나의 스케줄 입력 모달 (5-step)
- 모든 step 의 입력은 `localStorage` 에 즉시 영속화 — 실수 종료 후 재진입해도 복원.
- Key: `bandage-schedule-{meetingId}-{userId}`.
- Step 0: 입력 방식 선택 (언더라인 탭) — 'AI 입력 (준비 중)' / '스케줄 입력'. AI 탭은 '곧 제공됩니다' placeholder.
- Step 1: 가능한 날짜
  - 합주 기간(meeting.practiceWindow) 모든 일자를 달력 그리드로 노출.
  - 필터: 평일만 / 주말만 / 전체 / 공휴일 제외(mock 공휴일 목록 + 토스트로 적용).
  - 일자 클릭 → 가능 ↔ 불가능 토글.
- Step 2: 시간 블록 선택 (when2meet 스타일)
  - 선택된 일자만 노출 (가용 day 위주). 1주 단위 — 좌우 화살표로 주차 이동.
  - 30분 단위, 9:00~22:00 기본 활성, 외 시간은 비활성 토글 가능.
  - 드래그 X(선택 셀 클릭으로 토글). 셀 색: 활성=accent-dim / 비활성=card.
- Step 3: 특이사항 텍스트 (Textarea, 200자)
- Step 4: 요약 + 제출

### 2-5. 멤버 클릭 시 우측 패널 (AI/Agent UX)
- 우측 패널(380px, 기존 SessionPanel 패턴 재사용 — overlay)
- 표시 정보 (UI 제안):
  - 이름·이메일·아바타
  - 입력 상태: 미입력 / 부분 / 완료
  - **가용 캘린더 미니뷰**: 합주 기간 N주를 작은 격자로 압축, 각 셀은 '가능 시간 비율'(예: 0%=빈칸, 1-50%=warn, 51-99%=accent, 100%=success)
  - 시간대 히트맵: 30분 슬롯을 가로축 시간(9-22), 세로축 요일로 깔고 짙기로 가능도 표현
  - 특이사항 메모

### 2-6. 곡 클릭 시 우측 패널
- 곡 정보 + '합주 가능 멤버 매트릭스':
  - 이 곡 세션 정원 = `totalNeed`
  - 곡의 확정자(또는 곡에 참여 가능한 멤버) ∩ 회의 참여 멤버 = 후보
  - 후보들의 스케줄을 종합해 '최소 N명 동시 가능' 슬롯 강조
  - 매트릭스: 가로 시간, 세로 일자 — 각 셀에 동시 가능 멤버 수 표시(success/warn/empty)

### 2-7. 매니저 확정
- '합주 일정 확정' 버튼 → 최적 슬롯 후보 자동 계산(가장 많은 멤버 동시 가능) → 확인 다이얼로그
- 확정 시: meeting 에 `confirmedSlot: { date, start, end }` 저장 + 모든 멤버에 toast(향후 BE 알림)
- BE 도입 시: POST /api/v1/setlist-meetings/{id}/practice-schedule

## 3. 라우트
- `/setlist-meetings/scheduling` — 빈 상태(첫 회의로 redirect)
- `/setlist-meetings/scheduling/{meetingId}` — 메인 화면
- 사이드바 sub 추가: '합주 일정 조율' → `/setlist-meetings/scheduling`

## 4. 도메인 / 데이터 모델

### 4-1. types
```ts
// setlist-meeting/types.ts
export type Meeting = {
  // ...
  /** 합주 가능 기간. mvp: 'YYYY-MM-DD'. */
  practiceWindow?: { from: string; to: string };
  /** 매니저가 확정한 합주 슬롯. */
  confirmedSlot?: { date: string; startMin: number; endMin: number } | null;
};
```

### 4-2. 신규 도메인 schedule-coordination
```
domain/schedule-coordination/
├── types.ts              # MemberSchedule, DayAvailability, TimeBlock
├── store/scheduleStore.ts # localStorage persist
├── components/           # CalendarMonthGrid, TimeBlockMatrix, MemberSchedulePanel, SongSchedulePanel
└── utils.ts              # 필터/교집합/최적 슬롯 계산
```

### 4-3. 캐싱
- localStorage key: `bandage-schedule-{meetingId}-{userId}`.
- payload: `{ availableDates: string[], unavailableDates: string[], blocks: { [date: string]: BitMask48 }, note: string, completed: boolean }`
- BitMask48 = 30분 × 48슬롯/일.

## 5. UI 가이드라인
- when2meet 스타일 시간 블록: row=요일, col=30분 슬롯. 셀 토글 click. 드래그는 v2.
- 캘린더 그리드: 7열 × N행, 일자 셀 click 토글. 비활성 일자는 회색.
- 우측 패널: 기존 SessionPanel 의 absolute 오버레이 패턴 재사용.

## 6. 백엔드 요청 (API_REQUIRED 추가)

### FE-API-040 회의 합주 기간 저장
- POST/PATCH 회의 시 `practiceWindow: { from, to }` 포함.
- v1 은 mock(localStorage) 만.

### FE-API-041 멤버 스케줄 제출
```
POST /api/v1/setlist-meetings/{id}/schedule
Body: { availableDates: [...], unavailableDates: [...], blocks: {...}, note }
```

### FE-API-042 회의 스케줄 종합 조회
```
GET /api/v1/setlist-meetings/{id}/schedule
Response: { perMember: [...], aggregate: {...} }
```

### FE-API-043 합주 일정 확정 (매니저)
```
POST /api/v1/setlist-meetings/{id}/practice-schedule
Body: { date, startMin, endMin }
```

## 7. 작업 분할
1. types + Meeting.practiceWindow + Step 3 합주 기간 입력
2. 라우트 + 사이드바 sub + master pane 재사용
3. 도메인 schedule-coordination (types/store/utils)
4. 메인 화면 — 좌/우 패널(멤버 리스트 + 곡 리스트) + 언더라인 필터
5. 나의 스케줄 입력 모달 (5-step) + localStorage 영속화
6. 멤버 클릭 → 우측 패널(개인 일정 시각화) + 곡 클릭 → 우측 패널(매트릭스)
7. 매니저 확정 — 최적 슬롯 계산 + 확정 다이얼로그
8. API_REQUIRED.md FE-API-040~043 등록

## 8. 비범위
- AI 자동 입력 (placeholder 만)
- 푸시 알림
- 드래그 선택 — 클릭 토글로 시작

## 9. 활성화 절차 (BE 도입 시)
- types/store 의 mock fetcher 를 실제 fetch 로 교체
- localStorage 캐시는 옵티미스틱 업데이트 자리로 활용
