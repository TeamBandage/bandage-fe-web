# Task ID: 4

**Title:** Phase D: 밴드 상세 화면 — TopBar/Tabs 레이아웃 재구성 (handoff 스펙 일치)

**Status:** in-progress

**Dependencies:** 1, 2

**Priority:** high

**Description:** `handoff/band-detail.md` 와 `handoff/specs/03-band.md` 의 데스크톱 마스터-디테일 스펙에 맞춰 BandDetailContent 의 TopBar / Tabs / Content 레이아웃을 재구성한다. 정보 / 멤버 / 신청 현황 3 탭 구조와 권한 정책을 정확히 반영한다.

**Source of truth:**
- `handoff/band-detail.md` (전체 가로 비율, TopBar 72px, Tab bar 48px, content 24/32 padding)
- `handoff/specs/03-band.md` (탭별 콘텐츠, 액션 버튼 권한)
- `handoff/specs/00-global-layout.md` (240/360/flex 마스터-디테일)
- `handoff/screens/03-band.png`, `07-band-detail.png` 캡처

**Details:**

1. 레이아웃 (handoff/band-detail.md L97-160 기준):
   - TopBar: height 72px, padding `0 32px`, 하단 1px border
     - breadcrumb "밴드 탐색" (12px / textMuted)
     - 타이틀: 22px / weight 700
     - 우측 액션 버튼: height 36px (sm)
   - Tab bar: height 48px, padding `0 32px`, 활성 탭 하단 2px accent 보더
     - 탭 텍스트 14px / weight 500, 비활성 textSub
   - Content: padding `24px 32px`, flex 1, overflow-y auto

2. 탭 구성 (3 탭): 정보 / 멤버 / 신청 현황
   - 신청 현황 탭: **LEADER 만 노출**. (handoff 스펙은 LEADER+ADMIN 이지만 현재 BE 에 ADMIN 역할이 정의돼 있지 않아 본 라운드는 LEADER 만 적용)
   - 비-LEADER 사용자에게는 DOM 자체에서 숨김

3. TopBar 액션 버튼:
   | 사용자 상태 | 버튼 |
   |---|---|
   | LEADER | "밴드 설정" (Settings 아이콘) |
   | MEMBER (LEADER 아님) | "밴드 탈퇴" (LogOut 아이콘) |
   | 비회원 | "가입 신청" (UserPlus 아이콘) |
   - "밴드 설정" 화면은 본 라운드 미구현 → toast info 안내

4. 정보 탭 (handoff/band-detail.md L133-160):
   - 커버 이미지 placeholder: 100% 너비 × **220px 고정** / 16px 라운드
     - profileImg 없을 시 Camera 아이콘 + "band cover image" 라벨
   - 밴드명 (h2, text-title)
   - 설명 (textSub, leading-relaxed)
   - 메타 라인: "멤버 N명" (memberCount). 결성일 등 부가 메타는 BE 미지원 → 생략
   - "다가오는 합주 / 다가오는 공연" 2-col 그리드 자리 → API 미구현으로 EmptyState (Phase E 톤) 표시 또는 본 라운드 생략

5. 멤버 탭:
   - 2-column 그리드 (`sm:grid-cols-2`, gap 12px)
   - BandMemberRow: bg-card border 카드, Avatar + 이름 + RoleBadge + (위임 버튼: LEADER 만, non-LEADER 멤버 대상)
   - 멤버 표시명은 Phase G (Task 7) 에서 정상화 예정 — 본 라운드는 `Member #{memberId}` 임시

6. 신청 현황 탭 (LEADER):
   - 상태 chip 필터: 대기중 / 승인됨 / 거부됨 (handoff/specs/03-band.md L41)
   - 신청 카드: Avatar + 신청자 이름 + 신청일 + 상태 배지 + 승인/거부 버튼
   - 신청일(`appliedAt`) 미지원 → 본 라운드는 "신청 대기 중" 텍스트로 폴백 + API_REQUIRED.md 신규 항목 추가

7. Tabs 컴포넌트: handoff 스펙의 underline 스타일 지원 위해 `variant` prop 추가 (`pill` 기본 / `underline` 신규). BandDetailContent 는 `underline` 사용. 기존 ListPane mine/discover 등은 `pill` 유지.

**Test Strategy:**

1. LEADER 계정: 밴드 설정 버튼 + 신청 현황 탭 노출
2. MEMBER 계정: 탈퇴 버튼만, 신청 현황 탭 미노출
3. 비회원: 가입 신청 버튼만, 신청 현황 탭 미노출
5. 1024 / 1280 / 1440 / 1920 px viewport 에서 240 / 360 / flex 비율 유지 (master-detail 비율 검증)
6. TopBar 72px / Tab bar 48px / content padding 24/32 확인
7. `pnpm typecheck && pnpm lint && pnpm test` 통과

## Subtasks

### 4.1. Tabs 컴포넌트 underline variant 추가

**Status:** pending
**Dependencies:** None

`src/components/ui/tabs.tsx` 에 `variant: 'pill' | 'underline'` prop 추가. underline 시 활성 탭 하단 2px accent 보더 + TabsList 가 가로 라인 형태.

### 4.2. BandDetailContent TopBar / Tabs / Content 레이아웃 재구성

**Status:** pending
**Dependencies:** 4.1

handoff/band-detail.md 의 72/48/24+32 스펙에 맞춰 헤더/탭/본문 영역 재배치. 액션 버튼 권한 정책 (LEADER/ADMIN/MEMBER/비회원) 적용.

### 4.3. 정보 탭 콘텐츠 정렬

**Status:** pending
**Dependencies:** 4.2

커버 이미지 220px / 밴드명 / 설명 / 멤버 N명 메타 / 다가오는 합주·공연 자리.

### 4.4. 신청 현황 탭 권한·필터 정렬 + API_REQUIRED 갱신 (스킵)

**Status:** skipped — 본 라운드 미수행

handoff 원본은 LEADER + ADMIN 접근을 명시하지만, 현재 BE 에 ADMIN 역할이 정의되지 않아 본 서브태스크는 보류한다. ADMIN 도메인 도입 시 별도 라운드에서 진행. chip 라벨(대기중/승인됨/거부됨) 과 `appliedAt` 미지원 문서화는 4.3 범위 내에서 일부 반영.
