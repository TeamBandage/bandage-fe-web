# 합주 일정 조율 v2 PRD

작성일: 2026-04-27
영향 도메인: `domain/schedule-coordination`, `domain/setlist-meeting` 일부
선행 라운드: schedule-coordination Phase 1 (마법사 + when2meet 시간표 v1)

## 0. 배경 / 목적
v1 출시 후 다음 한계가 노출됨.

1. **단일 페이지 구조** — 마스터-디테일 분리 없이 회의 1개에만 종속. 다른 선곡 회의의 일정 조율로 전환할 수 없음.
2. **반대 비율 분할 UI** — 멤버 리스트 / 곡 리스트가 좌우 절반씩 차지하면서 정작 시각화(시간표/매트릭스)가 우측 380px 패널로 좁음.
3. **기간 의존 매트릭스** — 합주 기간이 6개월이면 6개월치 블록을 한 번에 깔아 가독성 붕괴.
4. **타임블록 입력 UX** — 클릭만 가능, 드래그 미지원. 마지막 타임블록이 의문의 분할로 깨짐(렌더 오류).
5. **합주 시간표 자동 추천 부재** — 매니저가 후보 슬롯을 직접 골라 확정해야 해 의사결정 지원이 약함.

본 라운드(v2)는 위 다섯 가지를 해결한다. 매니저가 BE 추천(또는 손수 배치) 으로 합주 시간표를 직접 만들고 합주곡 블록을 끌어다 놓는 본격적인 시간표 생성 기능을 도입한다.

## 1. 범위 요약

| # | 항목                                                  | 우선순위 |
|---|-------------------------------------------------------|---------|
| 0 | 마스터-디테일 구조 (선곡 회의 sidebar 패턴 재사용)     | high    |
| 1 | 합주 기간 길이에 따른 단위 전환 (일/주/월)             | high    |
| 2 | 매니저용 '합주 시간표 생성' 탭 + 블록 드래그 배치     | high    |
| 3 | 메인 헤더 진행도 게이지(파랑/초록)                     | medium  |
| 4 | '나의 스케줄 입력' 모달 — 입력 방식 탭 제거 + 번호 재배열 | medium  |
| 5 | '나의 스케줄 입력' Step 3(시간 블록) 드래그 + 24h 토글 + 분할 버그 수정 | high |
| 6 | mock 데이터 (자동 추천/시간표 등) 구비                 | medium  |
| 7 | API_REQUIRED.md FE-API-050~055 신규 등록               | low     |

## 2. 사용자 시나리오

### 2-1. 마스터-디테일 진입 (Task 0)
- 사이드바 '선곡 회의 > 합주 일정 조율' → `/setlist-meetings/scheduling`
- 좌측 마스터 패널 자동 펼침 (선곡 회의 ListPane 과 동일 컴포넌트 재사용)
- 회의 클릭 → `/setlist-meetings/scheduling/{meetingId}` + 패널 자동 닫힘 + 토글 버튼 노출
- ListPane 의 진행도 막대:
  - 분모 = 확정 곡(`isReady`) 참여 멤버 합집합 수
  - 분자 = 일정 입력 완료한(`schedule.completed=true`) 멤버 수
  - 시간표 확정(=매니저가 시간표 1개를 'Confirm') 시: 초록(`bg-success`)
  - 그 전: 파랑(`bg-accent`)

### 2-2. 메인 화면 — 절반 분할 + 큰 시간표 (Task 0, 3)
- 상단 헤더: 회의 제목/매니저/합주 기간 + 본인 스케줄 입력 버튼 + 진행도 게이지
- 본문 좌우 분할 (md 이상):
  - **왼쪽(약 40%)**: 언더라인 탭 — `멤버 시간표 / 합주곡 시간표 / 합주 시간표 생성(매니저만)`
    - **멤버 시간표**: 멤버 리스트(아바타/이름/입력 상태). 클릭 시 우측에 그 멤버의 가용 캘린더 + 히트맵
    - **합주곡 시간표**: 곡 리스트(필터 '내 합주곡/전체'). 클릭 시 우측에 그 곡의 동시 가능 매트릭스
    - **합주 시간표 생성** (매니저 전용): 시간표 카드 목록(최대 5장) + '+ 시간표 생성' 버튼
  - **오른쪽(약 60%)**: 큰 시각화 영역. 좌측 탭에서 선택한 항목에 따라 컨텐츠 교체:
    - 멤버 선택: 가용 캘린더 + 시간 히트맵 (가독 큰 셀)
    - 곡 선택: 동시 가능 매트릭스 (가독 큰 셀)
    - 시간표 카드 선택: 그리드 시간표 + 합주 블록 풀 (Task 2)

### 2-3. 일/주/월 단위 전환 (Task 1)
- 합주 기간 길이에 따라 자동 추천 + 사용자 토글:
  - ≤ 14일: 기본 **일** 단위 — `enumerateDays` 전체를 7열 그리드 1~2주
  - 15~60일: 기본 **주** 단위 — 1주씩 좌/우 이동 (현재 v1 패턴 유지)
  - > 60일: 기본 **월** 단위 — 한 화면에 한 달 캘린더, 셀당 가용 인원 농도 표기
- 좌/우 이동 버튼은 모든 단위에서 제공. '오늘로' 단축 버튼 제공.

### 2-4. '합주 시간표 생성' 탭 (매니저, Task 2)
- 시간표 카드 목록(최대 5개). 각 카드: 이름(예: '안 1'), 진행도, 상단 옵션 ⋯ (수정/삭제).
- 시간표 단건 화면(중앙 or 좌측-중앙):
  - 그리드 시간표: 행=일자(주차), 열=30분 슬롯
  - 옵션 토글: **9~22 기본 / 24h 확장**. 24h 일 때 가로 스크롤 또는 셀 압축.
  - 좌/우 화살표로 주차 이동.
  - 합주 블록 풀(우측 패널): 확정 곡 한 곡당 1 블록(중복 사용 가능). 색상은 디자인 토큰 기반 팔레트(accent/amber/success/warn/danger 의 dim 변형 등)에서 곡별 랜덤 고정.
  - 블록을 시간표 셀에 드래그 시 30분 슬롯에 스냅. 드롭 후 부드러운 등장 애니메이션.
  - 시간표의 합주 블록 클릭 → 우측 패널 열림: 곡명 (수정 가능), 메모, '고정' 토글(자동 재생성 시 위치 보존), 삭제.
  - 상단 ⋯ 메뉴: 공유(준비 중) / Export(jpeg, html2canvas 또는 dom-to-image — BE 도움 없이도 클라이언트에서 가능). 만약 폰트/이미지 cross-origin 이슈로 BE 가 필요하면 별도 노티.
  - **'시간표 생성' 버튼 (헤더 우측)**: 클릭 시 **최적 안 3개**를 생성. 빈 카드 2개도 함께 노출(빈 캔버스). 자동 생성된 안에 사용자 수정이 있는 상태에서 재 '생성' 시 경고 다이얼로그.
  - **'합주 시간표 확정' 버튼**: 단일 시간표 카드를 최종 확정. 확정 시 진행도 게이지 색이 초록으로 전환. 확정 후엔 추가 수정 시 모달로 경고.

### 2-5. 진행도 게이지 (Task 3)
- 위치: 메인 헤더 + 마스터 ListPane 의 회의 카드.
- 단계별 색:
  - 입력 진행 중 — `bg-accent`(파랑) + 회색 트랙
  - 시간표 확정 후 — `bg-success`(초록)
- 텍스트: `5/7 명 일정 입력 완료` (확정 전), `시간표 확정 — 5/7 참여` (확정 후).

### 2-6. '나의 스케줄 입력' 모달 정리 (Task 4, 5)
- 단계 재배열: ~~Step 0 입력 방식~~ 제거 → 1) 가능 일자 / 2) 시간 블록 / 3) 특이사항 / 4) 확인. 진행 바 4단계.
- 시간 블록 단계:
  - **9~22 기본 / 24h 확장 토글** 추가.
  - **드래그 입력**: 셀 위에서 mouse-down 시작 셀 기준 드래그 — 첫 셀이 'on/off' 의 어느 쪽이냐에 따라 일괄 set/clear.
  - 셀 크기 통일 — 마지막 슬롯 분할 버그 수정(현재 `<td>` 일부가 다른 width 로 깨지는 문제는 컬럼 width 강제로 해소).
  - 다일자 선택 후, 'X 요일과 동일한 패턴 복사' 빠른 액션 버튼(Y 일자 그리드 위에 노출) — 반복 입력 부담 최소화.

### 2-7. mock 데이터 (Task 6)
- 시간표 자동 추천 mock — 멤버 가용 종합에서 동시 가능 인원이 가장 많은 슬롯 N개를 선택하여 곡을 배치.
- 시간표 카드 mock — TOOL TRIBUTE 회의에 대해 1~3개 시간표 + 색상 팔레트 미리 채움(개발자 검토용).

## 3. UI 설계 가이드

### 3-1. 컬러 팔레트 (시간표 블록)
서비스 디자인 토큰 기반:
- `bg-accent-dim` / `bg-success-dim` / `bg-warn-dim` / `bg-amber-dim` / `bg-danger-dim` + `bg-card-hover` 등 6~8 종.
- 곡별 hash 로 결정해 같은 곡은 항상 같은 색.

### 3-2. 드래그 동작
- 시간 블록 입력: 셀 mousedown → 첫 셀 toggle 결정(현재 on 이면 'unset', off 면 'set') → mousemove 동안 같은 모드로 셀 적용 → mouseup 종료.
- 합주 블록 배치: HTML5 drag-and-drop API. `dragstart` 시 dataTransfer 에 songId 저장. `dragover` + `drop` 핸들러를 시간표 셀에 부여.

### 3-3. 새 컴포넌트 (예상)
- `SchedulingMasterPane.client.tsx` — 회의 목록 마스터.
- `SchedulingDetailHeader.client.tsx` — 진행도 게이지 + 액션.
- `SchedulingTabs.client.tsx` — 좌측 언더라인 탭.
- `MemberAvailabilityViewer.client.tsx` — 큰 멤버 가용 시각화.
- `SongAvailabilityMatrix.client.tsx` — 큰 곡 동시 가능 매트릭스.
- `ScheduleBoardEditor.client.tsx` — 매니저 시간표 생성 메인.
  - `ScheduleBoardCard.tsx` — 시간표 카드.
  - `ScheduleBlockPool.tsx` — 우측 합주 블록 풀.
  - `ScheduleBlockChip.tsx` — 드래그 가능한 블록.
  - `ScheduleBoardCell.tsx` — 시간표 30분 셀.
  - `ScheduleBlockPanel.tsx` — 우측 상세 패널.
  - `useScheduleBoard.ts` — 상태/드래그 관리 훅.
- `ScheduleInputModal v2` — 4-step 재배열 + 드래그 입력 + 24h 토글.

### 3-4. 데이터 모델 (단순화)
```ts
// schedule-coordination/types.ts (확장)
export interface ScheduleBoard {
  boardId: string;
  meetingId: string;
  name: string;       // '안 1', '안 2', 사용자 수정 가능
  blocks: ScheduleBlock[];
  pinned: string[];   // pinned blockId 목록
  paletteSeed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleBlock {
  blockId: string;
  songId: string;     // 회의 곡 id
  date: string;       // 'YYYY-MM-DD'
  startSlot: number;  // 0~47
  durationSlots: number;
  songTitleOverride?: string;
  note?: string;
  pinned: boolean;
  paletteIndex: number;
}

// 시간표 확정 — 1개 board 만 confirmed.
export interface MeetingScheduleConfirmation {
  meetingId: string;
  confirmedBoardId: string | null;
}
```

## 4. 백엔드 요청 (API_REQUIRED 추가)

### FE-API-050 멤버 스케줄 종합 — 자동 추천 입력
```
POST /api/v1/setlist-meetings/{id}/schedule/auto-suggest
Body: { count: 3 }
```
응답: 추천 시간표 N개. v1 mock 으로 우회.

### FE-API-051 시간표 CRUD
```
GET    /api/v1/setlist-meetings/{id}/boards
POST   /api/v1/setlist-meetings/{id}/boards
PATCH  /api/v1/setlist-meetings/{id}/boards/{boardId}
DELETE /api/v1/setlist-meetings/{id}/boards/{boardId}
```
- 단일 회의 최대 5개 boards. 한 board 만 confirmed=true 가능.

### FE-API-052 시간표 블록 CRUD (벌크)
```
PATCH /api/v1/setlist-meetings/{id}/boards/{boardId}/blocks
Body: { add: [...], remove: [blockId], update: [{blockId, ...patch}] }
```

### FE-API-053 시간표 확정
```
POST /api/v1/setlist-meetings/{id}/boards/{boardId}/confirm
```
다른 board 가 confirmed 면 자동 unconfirm 후 새 board confirm. 알림 트리거.

### FE-API-054 시간표 export 지원 (선택)
- Export(jpeg) 는 클라이언트 도메인 to image 로 우선 처리. 폰트/이미지 cors 이슈 시 BE 측 SVG → PNG 변환 엔드포인트 검토.

### FE-API-055 시간표 공유 링크
```
POST /api/v1/setlist-meetings/{id}/boards/{boardId}/share
```
응답: 공유 토큰 url. v1 은 placeholder.

## 5. 작업 분할 (Task)

1. **Task 1**: 마스터-디테일 + 회의 카드 진행도 게이지 + 메인 헤더 게이지 (Task 0/3 일부)
2. **Task 2**: 메인 절반 분할 + 좌측 언더라인 탭(멤버/곡/시간표) + 큰 시각화 영역 슬롯 (Task 0)
3. **Task 3**: 일/주/월 단위 전환 — 큰 시각화 영역의 매트릭스/캘린더 (Task 1)
4. **Task 4**: 시간표 생성 셸 (카드 목록, +생성, 자동 추천 mock, 5개 제한)
5. **Task 5**: 시간표 단건 에디터 — 그리드 + 블록 풀 + 드래그-드롭 + 30분 스냅 (Task 2 본체)
6. **Task 6**: 시간표 블록 우측 패널(수정/고정/삭제) + 컬러 팔레트 + 색상 안정 매핑
7. **Task 7**: 24h 토글 + 24h 시 가로 스크롤 적용 (Task 2 옵션)
8. **Task 8**: 시간표 확정 (게이지 색 전환, 단일 confirmed 보장)
9. **Task 9**: '나의 스케줄 입력' 모달 정리 — 4-step 재배열 + 드래그 + 24h 토글 + 마지막 슬롯 분할 버그 수정 + 패턴 복사 보조 액션 (Task 4/5)
10. **Task 10**: Export(jpeg) — `html2canvas` 또는 `dom-to-image-more` 도입 + 캡처 영역 지정
11. **Task 11**: mock 데이터 (시간표 카드 1~3장 + 자동 추천 결과 + 색상 팔레트 시드)
12. **Task 12**: API_REQUIRED.md FE-API-050~055 등록 + 산출물 정리
13. **Task 13**: Auto-rescheduling 엔진 + Working Hours UI + Undo/변경 로그 (§5-A)
   - 13-1 자원 충돌 감지 + BFS 재배치 알고리즘 (`placeBlock` 헬퍼, pinned 면제, working hours 회피)
   - 13-2 Working Hours / 주말·공휴일 제약 UI (시간표 카드 상단 옵션 바) + 비활성 셀 시각화
   - 13-3 드롭 ghost 미리보기 + 충돌 영역 빨간 점선 + 편집 잠금 셀 stripe
   - 13-4 Undo 토스트(5초) + 변경 로그 사이드 패널 (최근 10개)

## 5-A. Reclaim.ai / Homebase·Sling 영감 — 추가 UX 요건

v2 핵심에 **반응형 자동 재배치(Auto-rescheduling)** 와 **근무 시간(Working Hours) 제약 UI** 를 결합한다. 매니저의 인지 부담을 줄이고 시간표 편집 시 발생하는 도미노 충돌을 자동 해소.

### 5-A-1. Auto-rescheduling (드래그 시 연쇄 재조정)

요건:

1. **드래그 의도 보존** — 사용자가 합주 블록 A 를 시간표 셀에 드롭하면 그 위치는 우선 확정.
2. **충돌 감지** — A 가 기존 블록 B 와 겹치면(같은 자원 = 같은 일자/시간) 충돌로 판정. v1 자원은 '시간 슬롯' 단위(추후 멤버 자원으로 확장 가능).
3. **연쇄 밀어내기**:
   - 충돌난 B 는 다음 가용 슬롯(working-hours 내 가장 가까운 30분 단위)으로 이동.
   - B 가 밀리면서 또 다른 블록 C 와 충돌하면 C 도 같은 규칙으로 이동(BFS 큐).
   - 합주 기간(`practiceWindow.to`) 을 초과하면 그 블록은 unscheduled 상태로 빠져 우측 풀에 재배치.
4. **고정(pinned) 블록은 면제** — 기존 'pinned=true' 블록은 절대 이동하지 않음. 새 블록 A 가 pinned 영역에 부딪히면 A 가 다음 슬롯으로 이동(역방향).
5. **부드러운 시각 피드백** — 영향받는 블록은 200ms transition 으로 새 위치로 슬라이드. 충돌이 해소되지 않은 블록은 빨강 외곽선 + toast.warn.
6. **Undo** — 드롭 직후 5초 동안 상단에 'Undo' 토스트(Reclaim 패턴). 클릭 시 이전 상태 복원.

알고리즘 (의사 코드):

```
function placeBlock(board, dropped):
  conflicts = findOverlap(board, dropped)
  affected = [dropped]
  queue = conflicts.filter(b => !b.pinned)
  while queue not empty:
    b = queue.shift()
    nextSlot = findNextFreeSlot(board, b, after=b.startSlot, withinWorkingHours)
    if nextSlot is null:
      b.unscheduled = true
      continue
    b.move(nextSlot)
    affected.push(b)
    queue.push(...findOverlap(board, b))
  return affected
```

### 5-A-2. Working Hours / 제약 조건 UI

상단 옵션 영역(시간표 카드 헤더) 에 토글 그룹:

- **근무 시간(Working Hours)**: `09:00 ~ 22:00` (기본). 슬라이더 또는 두 input 으로 조정.
- **심야 배제(No-late-night)**: ON 시 `22:00 ~ 익일 09:00` 셀이 비활성(드래그·드롭 차단, 자동 재배치 시에도 회피).
- **주말 배제(Weekday only)**: ON 시 토/일 행이 비활성.
- **공휴일 배제**: 한국 공휴일(`isHoliday` 헬퍼) 셀 비활성.
- **최소 합주 간격**: 같은 멤버가 연속 합주를 피하기 위한 30분/60분/없음 옵션 (P2 — 멤버 자원 도입 시 활성).

UI 예시 — Reclaim.ai 의 상단 inline 옵션 바와 유사. 모바일은 'BottomSheet' 로 제공.

데이터 모델 추가:

```ts
export interface ScheduleBoardConstraints {
  workingHoursStart: number;   // 0~47 슬롯 인덱스, 기본 18 (09:00)
  workingHoursEnd: number;     // 기본 44 (22:00)
  excludeWeekends: boolean;    // 기본 false
  excludeHolidays: boolean;    // 기본 true
  minGapSlots: number;         // 0|1|2 (P2)
}
```

### 5-A-3. UX 가이드(Reclaim/Sling 차용)

- **드래그 시 'ghost' 셀 하이라이트** — 마우스가 가리키는 셀에 점선 테두리로 미리보기. 충돌 가능 영역은 빨간 점선.
- **이동된 블록 토스트** — '3개 블록이 자동 재조정되었습니다.' 같이 영향 범위 요약. 클릭 시 변경 로그 패널 열림.
- **변경 로그 패널** — 우측 사이드 토글. 최근 10개 작업 시간순 + 각 항목 'Undo'.
- **편집 잠금** — Working Hours 외부 셀은 시각적으로 줄무늬 패턴(stripe) + cursor not-allowed.

### 5-A-4. 영향받는 작업

- Task 5(시간표 단건 에디터): drop 핸들러 → `placeBlock` 함수 사용. 자체 useScheduleBoard 훅 내에 구현.
- Task 6(블록 우측 패널): pinned 토글이 자동 재배치 면제 처리에 직접 연결됨.
- Task 7(24h 토글): Working Hours UI 와 통합 — 토글이 사실상 'workingHoursStart=0, end=48' 의 단축.
- **신규 Task 13**: Auto-rescheduling 엔진 + Working Hours 제약 UI + Undo 토스트 + 변경 로그 패널.

### 5-A-5. 비범위

- 멤버 자원 충돌(같은 멤버가 같은 시간에 두 곡) — 본 라운드는 시간 슬롯만 고려.
- AI 기반 자동 우선순위 — Reclaim 의 'Priority' 기능은 P2.

## 5-B. '나의 스케줄 입력' UX 디테일 — 레퍼런스 차용 (Task 9 보강)

본 섹션은 Task 9 의 구현 가이드를 한 단계 더 깊이 정의한다. 사용자가 합주 기간 N주짜리 가용 시간을 빠르게 입력할 수 있도록 **레퍼런스(Reclaim.ai · Homebase·Sling · Doodle/When2meet)** 의 UX 패턴을 적극 차용한다.

### 5-B-1. 핵심 사용 시나리오

| 사용자                                         | 빈도       | 최적 도구                                           |
|------------------------------------------------|------------|-----------------------------------------------------|
| 매주 같은 패턴(평일 19-22, 주말 13-22)         | 가장 흔함  | **반복 패턴 프리셋 + Repeat-weekly 토글** (5-B-3) |
| 주마다 약간씩 다름 — 한 주 입력 후 다음 주에 복사 | 자주       | **'전 주와 동일' / 'X요일과 동일' 복사** (5-B-4)   |
| 특정 날짜만 단발성 변경                        | 드뭄       | 셀 드래그 입력(5-B-2)                              |
| 24시간 가능(올나잇 합주 등)                    | 드뭄       | 24h 토글 + 드래그                                   |

### 5-B-2. 셀 입력 — Sling/When2meet 차용

- **클릭+드래그 페인트**: mouse-down 시 첫 셀의 현재 값을 반전(on→off / off→on) 하고, 드래그하는 동안 같은 모드를 유지하여 brush 처럼 칠함. (Sling 의 shift drag-fill, When2meet 의 핵심 동작과 동일.)
- **세로 드래그**: 같은 시간대를 여러 일자에 일괄 적용. (예: 19:00 컬럼을 5일치 한 번에 토글.)
- **대각선 드래그**: 자유로운 사각 영역 페인트.
- **셀 사이즈 통일**: 마지막 슬롯 분할 버그(현재 발생 중) 수정 — `<col>` 또는 `grid-template-columns` 로 강제 균등.
- **터치 지원**: PointerEvent 기반 — 모바일에서도 동일하게 brush 동작.

### 5-B-3. 시간 프리셋 칩 — Reclaim 'Habits' 차용

상단에 가로 스크롤 칩 그룹:

```
[ 오전 09-12 ] [ 점심 12-14 ] [ 오후 14-18 ] [ 저녁 19-22 ] [ 심야 22-02 ]
[ 평일 저녁 ] [ 주말 종일 ] [ 모두 가능 ]
```

- 칩 클릭 시: 현재 보이는 주차의 **선택된 일자(=Step 1 의 가능 일자)** 에 해당 시간 mask 를 OR 적용.
- Shift+클릭: 해당 mask 만 남기고 나머지는 비움(replace).
- Alt+클릭: 해당 mask 영역을 빼기(remove).
- 자주 쓰는 칩은 사용자별 localStorage 에 빈도 저장하고 상위 3개를 'Quick' 으로 prefix.

### 5-B-4. Sling 차용 — 'Copy & Repeat'

본 단계의 핵심 시간 절약 기능. 모달 우측 상단(또는 시간 그리드 위)에 액션 그룹:

- **'전 주와 동일' (Repeat last week)**: 현재 보이는 주차에 직전 주차의 mask 를 복제.
- **'모든 주차에 적용' (Apply to all weeks)**: 현재 주차 패턴을 합주 기간 모든 주에 brand-cast. 확인 다이얼로그(덮어쓰기 경고).
- **'요일 복사 → 다른 요일'**: 일자 라벨 우측 ⋯ 메뉴 — 'X요일을 복사' 후 다른 일자 클릭으로 붙여넣기.
- **요일별 '다른 요일과 동일'** 빠른 액션: 요일 라벨 hover 시 inline 미니 메뉴.

키보드 단축키:

| 키            | 동작                                          |
|---------------|-----------------------------------------------|
| `Cmd/Ctrl+C`  | 현재 주차 mask 복사                          |
| `Cmd/Ctrl+V`  | 클립보드에서 현재 주차에 붙여넣기            |
| `Cmd/Ctrl+Z`  | 마지막 변경 undo (최대 10개 history)         |
| `Shift+클릭`  | 영역 선택 — 첫 셀부터 마지막 셀까지 사각 페인트 |

### 5-B-5. 시간 그리드 — 레퍼런스 차용 시각 디테일

- **시각축 레이블 sticky**: 좌측 일자 / 상단 시간 라벨이 스크롤 시 고정. (Sling 표준)
- **현재 주차 위에 주차 nav + '오늘' 단축**.
- **24h 토글 ON 일 때**: 가로 스크롤 + 시간축이 24px × 48 슬롯. 스크롤 위치 메모.
- **활성 셀 스타일**: `bg-accent` (파란색) + 모서리 라운드 1px. **'maybe' 1단계** 추가 옵션(P2): 같은 칸 더블 클릭 시 빗금 패턴.
- **불가 시간(Working Hours 외부)**: stripe + 50% opacity. 페인트 시도 시 토스트 — '근무 시간 외입니다' (Reclaim 패턴).

### 5-B-6. 진행/요약 — Sling 차용

모달 푸터 위에 inline 요약:

```
선택 일자 8일 · 총 가용 시간 36h · 평균 일당 4.5h
```

- 입력하면서 실시간으로 갱신.
- 마지막 'Step 4 확인' 단계는 위 요약 + 텍스트 메모 + 큰 미니맵(7×N 셀의 농도 헤트맵) 으로 한 화면.

### 5-B-7. Reclaim 차용 — 'Smart Defaults'

처음 모달 진입 시 자동으로 다음 두 옵션을 제안:

- '평일 저녁 19-22 + 주말 종일' 프리셋을 미리 선택해 둔 상태로 시작 (사용자 70%+ 가 이 패턴).
- 우측 상단에 '비우고 시작' 버튼 — 한 번에 reset.

### 5-B-8. 입력 흐름 (4-step 재배열)

1. **가능 일자**: 캘린더 grid 7×N. 평일/주말/공휴일 제외 필터 + Reclaim 'Smart Default' 적용.
2. **시간 블록**: 위 5-B-2/3/4 모두 활성. 24h 토글 + Working Hours 외부 stripe.
3. **특이사항**: Textarea — 최대 200자.
4. **확인**: §5-B-6 요약 + 미니맵 + 저장.

### 5-B-9. 영향받는 작업

- Task 9 (나의 스케줄 입력 모달 v2) 의 서브태스크 확장:
  - 9-A 셀 페인트 드래그 + 셀 균등화 (5-B-2)
  - 9-B 시간 프리셋 칩 + 모디파이어 (Shift/Alt) (5-B-3)
  - 9-C Copy & Repeat (전주 동일 / 모든 주 / 요일 복사) (5-B-4)
  - 9-D 24h 토글 + sticky 헤더 + 'maybe' 옵션 (5-B-5)
  - 9-E 실시간 요약 + 확인 단계 미니맵 (5-B-6)
  - 9-F Smart Default + 비우고 시작 (5-B-7)
- 키보드 단축키 (Cmd+C/V/Z) 는 9-G 로 분리 — 데스크톱 한정, 모바일은 placeholder.

### 5-B-10. 비범위

- 외부 캘린더(Google/Apple) 가져오기 — Reclaim 의 핵심이지만 본 라운드 비범위.
- AI 기반 자동 채우기 — 본 라운드 placeholder 만.

## 6. 비범위
- 실제 BE 호출 — 본 라운드는 mock-first
- 외부 캘린더(구글 등) 연동
- 알림/푸시
- 다인 동시 편집(operational transform)

## 7. 활성화 절차 (BE 도입 시)
1. FE-API-050~055 명세를 `API_SPEC.md` §7 또는 신설 §8 으로 추가
2. `domain/schedule-coordination/api/` 신설 후 store action 의 mock 부분만 fetcher 로 교체
3. `.taskmaster/report/schedule-board-integration-YYYY-MM-DD.md` 로 통합 검증 리포트
