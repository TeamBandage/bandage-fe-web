<context>
# Overview
Bandage MVP 1차 보정 5 라운드(mvp-1-fix-v5). 4 라운드까지 모달/마법사/검색 모달 일반화/UX 보강이 마무리되며 도메인 핵심 흐름은 자리잡았다. 이번 라운드는 (1) 사용자가 직접 사용하면서 화면이 답답하다고 지적한 **레이아웃 비율 문제**를 선행 처리하고, (2) Claude Design 이 새로 생성한 **선곡 회의(Setlist Meeting)** 기능 — 밴드 합주에 앞서 곡을 모으고 세션을 채워 나가는 협업 툴 — 을 신규로 도입한다.

핵심 출처
- 사용자 피드백 (2026-04-26): "현재 맥북 에어 13 기준으로 사이드바와 마스터 탭이 화면의 절반을 차지함. 프로토타입처럼 화면의 3분의 1 이하로 줄이고, 글씨와 전체 컴포넌트 비율도 수정"
- design/web/setlist_web.jsx — 선곡 회의 화면 프로토타입(874줄)
- 사용자 제공 스크린샷 4장 — 회의 마스터/곡 표/세션 패널/사이드바 비율 기준
- 현재 globals.css 토큰 (sidebar: 240px / list-pane: 340px / band-list-pane: 360px)

# Goals
1. **레이아웃 축소 — 1/3 이하**: 사이드바 + 마스터 패널 합이 화면 너비의 33% 이하 (1280px 기준 약 420px). 글자/컴포넌트 사이즈도 비례 축소 — 답답함 제거.
2. **선곡 회의 모듈 도입**: 밴드별 곡 후보 + 세션 점유 현황 + 매니저 확정 + 곡별 채팅 — 3-Pane(회의 목록 / 곡 표 + 채팅 / 세션 패널) 풀 기능 화면. 사이드바에 신규 탭 추가.
3. **백엔드 미지원 영역 명시**: 선곡 회의는 BE 엔드포인트 0건 — Zustand 로컬 store + 더미 데이터로 구현. 모든 API 후보를 API_REQUIRED.md FE-API-024~030 으로 등록.

# Non-goals
- 백엔드 신규 API 구현 (요청만 정리)
- 선곡 회의 → 실제 합주 생성 자동 연결 (수동 변환)
- 모바일 전용 3-pane 레이아웃 (lg 이상에서만 풀 3-pane, 모바일은 마스터 → 디테일 → 세션 패널 순차 stacked)

# Audience & UX context
- 다크 테마 고정. lg(960px) 마스터-디테일 우선
- MBA 13 (1280×800) 기준으로 답답하지 않게
- 선곡 회의는 "엑셀 차트" 비주얼 — 곡 1개 = 1행, 세션 = 컬럼 내 컴팩트 트랙

# Existing architecture (재사용 대상)
- src/app/globals.css — `--sidebar-w`, `--list-pane-w`, `--band-list-pane-w` 토큰
- src/components/layout/{Shell, Sidebar, BottomNav, PaneSplit, PaneList, PaneDetail}
- src/components/ui/* — Button, Tabs, Dialog, ResponsiveSheet, Avatar, Chip, EmptyState
- src/global/navigation/{dirty-form-context, guarded-link} — 마법사 가드
- src/global/store/* — Zustand store 패턴
- src/domain/* — 기존 도메인 모듈 (band, practice, performance, member)

</context>
<PRD>
# Scope (Phases)

## Phase A — 선행: 레이아웃 비율 축소 (디자인 토큰 + 컴포넌트 사이즈)

대상
- src/app/globals.css — width/font 토큰
- src/components/layout/sidebar.tsx — 폰트/패딩 슬림화
- src/app/(main)/{bands,practices,performances}/*ListPane.client.tsx — 카드 padding/font
- src/components/ui/{button, input, card, chip} — sm/md 사이즈 미세 조정 (필요시)

요건
- `--sidebar-w` 240px → **200px**
- `--list-pane-w` 340px → **280px**
- `--band-list-pane-w` 360px → **280px**
- 합계 480px (이전 600px) — MBA 13 (1280px) 기준 37.5% (이전 47%). 1440px 기준 33%.
- 사이드바 nav item: 패딩 `py-s-3` → `py-s-2`, 폰트 `text-body` → `text-caption`
- 사이드바 로고/Bandage 텍스트: 사이즈 한 단계 축소
- 마스터 카드: padding `p-s-3` → `p-s-2`, 제목 `text-body` → `text-caption`
- 도메인 IconTile size: 'sm' (현재) 그대로 유지
- 본문 영역(`<main>`) 의 가로 padding 변경 없음

검증
- MBA 13 (1280px) 에서 사이드바 + 마스터가 화면의 38% 이하
- 데스크톱 풀스크린 (1440px+) 에서 33% 이하
- 모바일에서는 영향 없음 (lg 미만은 BottomNav)

## Phase B — 선곡 회의 도메인 골격 (도메인 모듈 + Zustand store)

신규 도메인: `src/domain/setlist-meeting/`

- `types.ts` — Meeting, Song, Session, Applicant, ChatMessage 등
- `store/setlistStore.ts` — Zustand
  - state: meetings[], selectedMeetingId, selectedSongId, focusedSessionId
  - actions: applySession, withdrawSession, confirmSession, unconfirmSession, sendChat, addSong, addCustomSession
- `mock/seed.ts` — 프로토타입 데이터 시드 (TOOL TRIBUTE 7곡 + 마그마 1회의)
- `utils.ts` — sessionState/isReady/missingCount/totalNeed/confirmedCount 헬퍼

요건
- BE 미지원 — Zustand 단독 (refresh 시 시드만 노출)
- 추후 BE API 도입 시 store 의 mutation 메서드만 fetcher 호출로 교체

## Phase C — 사이드바 신규 탭 + 라우팅

대상
- src/global/config/routes.ts — `SETLIST_MEETINGS`, `SETLIST_MEETING_DETAIL(id)`
- src/components/layout/sidebar.tsx — '선곡 회의' 항목 (홈/밴드/합주/공연/마이페이지 사이)
- src/components/layout/bottom-nav.tsx — 동일

요건
- '선곡 회의' nav 항목, 아이콘 ClipboardList (lucide-react)
- 활성 경로: `/setlist-meetings` 또는 `/setlist-meetings/{id}`
- 사용자가 참여 중인 회의 수 배지 (옵션)

## Phase D — 회의 목록 마스터 패널

신규 라우트
- `src/app/(main)/setlist-meetings/page.tsx` — 첫 회의 자동 선택 → 라우트 redirect
- `src/app/(main)/setlist-meetings/layout.tsx` — 마스터 패널 + children
- `src/app/(main)/setlist-meetings/SetlistMeetingsListPane.client.tsx` — 회의 카드 리스트

요건
- 카드: 밴드명(작은 accent) + 회의 제목(굵은) + 진행 막대(ready/total) + updatedAt
- 선택 시 라우트 push
- '회의 만들기' 버튼 (BE 미지원 — toast 안내 + FE-API-024 등록)
- 빈 상태 EmptyState

## Phase E — 곡 표 (엑셀 형태) + 곡 추가

신규
- `src/app/(main)/setlist-meetings/[meetingId]/page.tsx`
- `src/app/(main)/setlist-meetings/[meetingId]/MeetingDetail.client.tsx`
- `src/domain/setlist-meeting/components/SongTable.client.tsx`
- `src/domain/setlist-meeting/components/SessionTrack.tsx` — 컬럼 내 세션 미니 트랙 (V/G/B/D + 채움 막대)
- `src/domain/setlist-meeting/components/AddSongModal.client.tsx` — 곡 추가 (제목/아티스트/앨범/추천자 의견 + 커스텀 세션)

요건
- 표 컬럼: # / 곡명 / 아티스트 / 앨범 / 세션 점유 현황 / 추천자 의견 / 진행도
- 합주 가능(모든 세션 확정) 행은 좌측 success 보더 + 살짝 success 톤 배경 + ✓ 배지
- 세션 셀: V/G/B/D 짧은 라벨 + 색상 (success=확정완료, warn=일부확정, muted=빈자리, accent=내가지원)
- 행 클릭 → 세션 패널 오픈, 세션 셀 클릭 → 해당 세션 focus
- 필터 탭 (전체/합주 가능/모집 중/내 지원) + 검색 input
- 상단 헤더: 밴드명, 회의 제목, 통계(전체 N곡 · 합주 가능 N곡 · 모집 중 N곡), '곡 추가' 버튼

## Phase F — 우측 세션 패널 (지원/확정)

신규
- `src/domain/setlist-meeting/components/SessionPanel.client.tsx`
- 두 가지 뷰: (i) 곡 전체 세션 카드 그리드, (ii) 단일 세션 focus (지원자 리스트 + 매니저 확정 액션)

요건
- 헤더: 곡명/아티스트, 매니저 배지(있으면)
- 추천자 의견 카드 (accent-dim 배경)
- 세션 카드: 라벨 / 확정 N/필요 / 지원자 N명 / 내가 지원함 / 내가 확정됨 표시
- 단일 세션 focus 시
  - 헤더: 라벨 + 확정 칩 + 지원자 N · 필요 N
  - 지원자 리스트 (avatar/이름/역할/확정 ✓ 표시)
  - 매니저면 각 지원자에 [확정]/[해제] 버튼
  - 본인이 미지원 → '이 세션 지원하기' 버튼
  - 본인이 지원 + 미확정 → '이 세션 지원 취소'
  - 본인이 확정 + 비매니저 → 취소 불가 (안내)

## Phase G — 곡별 채팅 분할 패널

신규
- `src/domain/setlist-meeting/components/MeetingChatBox.client.tsx`

요건
- 디테일 영역 하단의 split 패널 (드래그 리사이즈는 v6 예정 — v5 는 고정 높이 280px)
- 메시지 목록 + 본인 메시지는 우측 정렬 + accent-dim 버블, 타인은 좌측 + card 배경
- 입력 input + 전송 버튼 (Enter 전송, Shift+Enter 줄바꿈)
- 메시지 전송 → setlistStore 의 sendChat 액션
- 모바일에서는 별도 라우트로 이동 (v5 는 Skip — placeholder 표시)

## Phase H — 회의 만들기 / 곡 추가 모달 + 매니저 권한

요건
- '회의 만들기' 모달: 제목/연결 밴드(BandPickerModal 재사용 — single)/매니저 자동(=현재 사용자)
- '곡 추가' 모달 (Phase E 의 일부)
- 매니저 권한: 회의 생성자 == 매니저. 매니저만 세션 확정/해제 가능
- 비매니저: 지원/취소만 가능
- API_REQUIRED FE-API-024~030 등록

## Phase I — API_REQUIRED v5 등록 + 산출물 정리

API_REQUIRED.md 신규 항목
- FE-API-024 회의 CRUD: `POST /api/v1/setlist-meetings`, `GET /me`, `GET /{id}`, `DELETE /{id}`
- FE-API-025 곡 CRUD: `POST /api/v1/setlist-meetings/{id}/songs`, `DELETE /{songId}`
- FE-API-026 세션 정의: `PATCH /api/v1/setlist-meetings/{id}/songs/{songId}/sessions` (커스텀 추가)
- FE-API-027 세션 지원: `POST /api/v1/.../sessions/{sessionId}/applicants`, `DELETE`
- FE-API-028 세션 확정/해제: `PATCH /api/v1/.../sessions/{sessionId}/confirmations` (매니저만)
- FE-API-029 채팅: `GET /chat`, `POST /chat`
- FE-API-030 회의 → 합주 변환: `POST /api/v1/setlist-meetings/{id}/convert-to-practices`

# Technical Constraints
- 라이브러리 신규 의존 금지 — 기존 Zustand/Tabs/Dialog/ResponsiveSheet 위에 구현
- 회의 데이터는 Zustand `persist` 미들웨어로 sessionStorage 보관 (refresh 후에도 사용자 액션 유지)
- 라우트 슬러그: `/setlist-meetings`
- 도메인 폴더명: `src/domain/setlist-meeting/` (단수형, 다른 도메인 컨벤션 일치)
- 모든 신규 컴포넌트에 `data-slot` 부여
- DirtyFormGuard — 곡 추가 모달 / 회의 만들기 모달이 dirty 시 가드

# Open Questions (사용자 컨펌 필요 — 미응답 시 default)
1. 회의 만들기 매니저 = 현재 사용자 / 추후 위임 가능. **default**: 위임 v6 로 미룸
2. 채팅 영역 — 분할 vs 별도 탭. **default**: 분할 (드래그 리사이즈는 v6)
3. 모바일에서 3-pane → 어떻게 펼지. **default**: v5 는 모바일 placeholder ("선곡 회의는 데스크톱에서 이용해 주세요")

</PRD>
