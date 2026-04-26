<context>
# Overview
Bandage MVP 1차 보정 4 라운드(mvp-1-fix-v4). 3 라운드까지 신규 me 엔드포인트 통합 / 합주 시작하기 마법사 / EntityPickerModal 일반화 / AuthBootstrapper / 비밀번호 강도 카피 / 홈 섹션 3건 제한 / 생성 API 실서버 검증 까지 마쳤다. 본 라운드는 사용자가 직접 사용해보면서 발견한 UX 디테일과 잔존 결함을 보강하는 것이 목표.

대표적 통증 (사용자 피드백 발췌)
- 사이드바 탭 전환 시 진행 중이던 마법사 입력값이 경고 없이 사라짐
- 합주는 사이드바 서브메뉴(나의 합주 / 합주 시작하기)가 분리됐지만 공연은 아직 단일
- 탐색 탭의 카드에서 "내 밴드/공연" 인지 시각적으로 표가 잘 안 남
- 밴드 설정 (사진 변경 / 정보 수정 / 삭제) UI 자체가 없음
- 합주 시작하기 Step 1 의 밴드 그리드가 밴드가 많으면 화면을 가득 채움
- DateTimePicker 의 시간 휠이 데스크톱에서 감도 문제로 불편
- 캘린더 연/월 변경이 양 옆 화살표만 있어 12개월 점프 비효율
- 마법사 마지막 단계가 "메타 입력 → 만들기" 1-step 이라 입력값을 한 번 더 확인할 기회가 없음
- 시스템 전반의 리소스 생성 성공 알림이 토스트만 — 더 명확한 피드백 필요
- 합주곡 검색 카드 선택해도 시각 변화가 적어 무엇을 골랐는지 헷갈림
- 밴드 멤버 이름이 `멤버 #2718` 처럼 표시 (Task 7 폴백이 작동 중)
- "직접 입력 (자작곡)" 라벨이 의미를 좁힘 — 자작곡 외에도 외부 검색에 안 나오는 곡이 있음

핵심 출처
- 사용자 직접 피드백 (2026-04-26)
- mvp-1-fix-v3 검증 리포트 (`.taskmaster/reports/create-api-verification-2026-04-26.md`)
- API_SPEC §3-3-2 /bands/search (Task 4 검색 모듈 재사용)
- design/handoff/specs/07-datetime-picker.md (캘린더/시간 입력 디자인 기준)

# Goals
1. **편집 안전성**: 사이드바 탭 전환 / 라우트 이탈 시 dirty 상태 마법사가 있으면 경고 모달.
2. **일관성**: 공연 사이드바를 합주와 동일하게 `나의 공연` / `공연 생성` 서브 분리. 공연 생성을 풀페이지 마법사로 통일.
3. **시인성**: 탐색 카드에 내 항목 표시 — 좌상단 "내 밴드" 핀 + 카드 좌측 보더 강조 등 다층 단서.
4. **밴드 설정 완성**: 정보 수정 / 사진 변경 / 삭제 모달. 백엔드 미지원 항목은 API_REQUIRED.md 등록.
5. **마법사 마지막 확정 단계 + 6 항목 그리드**: 사용자가 만든 합주의 모든 옵션을 한눈에 검토할 수 있는 패널 + 최종 확정 버튼.
6. **시스템 전역 리소스 생성 알림 표준화**: 모달 또는 강조 토스트 (배지 사이즈 / 아이콘 / persistence 통일).
7. **DateTimePicker UX 보강**: 캘린더 헤더 연/월 빠른 선택, 데스크톱 시간 입력 대체 UI, 시작/소요 시간 시각 강조.
8. **마법사 밴드 선택 6개 + 검색 통합**: 카드 그리드 6개 + "더 찾기" 버튼 → BandPickerModal (밴드 탐색과 동일 API).
9. **잔존 결함 정리**: "밴드 → 곡 → 일정" 카피 제거, 카드 선택 시각 강조, "(자작곡)" 라벨 제거, 멤버 이름 노출 원인 분석/수정, 무한 스크롤 동작 검증.

# Non-goals
- 백엔드 신규 API 직접 구현 (요청만 정리)
- v3 에서 차단으로 발견된 Practice ↔ PracticeSong 닭-달걀(FE-API-020) 의 직접 해결 — 백엔드 결정 후 후속 라운드에서 fetcher 만 교체
- 모바일 전용 UX 개선 (ResponsiveSheet 호환성만 유지, 신규 모바일 인터랙션은 별도)

# Audience & UX context
- 다크 테마 고정. lg(960px) 마스터-디테일 우선
- 마법사는 풀페이지 (Task 4 결정 유지)
- 시스템 전역 알림은 v3 의 useToast 위에 시각 강화 (애니메이션 + 사이즈 + 아이콘 통일)

# Existing architecture
- src/components/ui/{date-time-picker, entity-picker-modal, step-indicator, button, dialog, responsive-sheet, skeleton}
- src/components/feedback/{toast, toaster, error-state, empty-state}
- src/domain/{band, practice, performance}/components, hooks, api
- src/global/auth/{AuthBootstrapper, useBandRole}
- src/lib/home-feed.ts (Task 9)
- src/hooks/useInfiniteCursor — 페이징 통합 hook (Task 7-2 의 검증 대상)

</context>
<PRD>
# Scope (Phases)

## Phase A — 마법사 이탈 가드 (Navigation Guard)
대상
- 신규: src/global/navigation/dirty-form-context.ts (Provider + hook)
- 신규: src/components/feedback/leave-confirm-dialog.tsx (모달)
- src/components/layout/sidebar.tsx (Link 클릭 인터셉트)
- src/app/(main)/practices/new/PracticeCreateWizard.client.tsx (dirty 플래그 등록)
- 동일하게 향후 공연 생성 마법사 (Phase B 와 연계)

요건
- DirtyFormContext 가 마운트된 마법사로부터 `setDirty(true|false)` 신호 수신
- 사이드바 nav 클릭, 브라우저 뒤로가기, 페이지 이탈(window beforeunload) 모두 후크
- dirty=true 일 때 LeaveConfirmDialog 표시 → 확인 시 라우트 이동, 취소 시 머무름
- 마법사 단계가 0 이고 입력값이 모두 비어 있으면 dirty=false (마운트 즉시 가드 X)

## Phase B — 공연 사이드바 분리 + 풀페이지 마법사
대상
- src/components/layout/sidebar.tsx (공연 항목 expandable)
- src/global/config/routes.ts (`PERFORMANCE_NEW` 이미 존재)
- src/app/(main)/performances/new/page.tsx, new/PerformanceCreateForm.client.tsx → Wizard 로 교체
- src/app/(main)/performances/layout.tsx (`/performances/new` 풀페이지 opt-out)

요건
- Sidebar 공연 하위에 `나의 공연` / `공연 생성` 서브 메뉴
- 공연 생성 마법사: Step 1 기본 정보 (제목·장소·시간) → Step 2 참여 밴드 (BandPickerModal) → Step 3 검토 (Phase F 와 같은 확정 패널)
- 기존 PerformanceCreateModal 는 사용처 모두 라우트 링크로 교체 후 삭제

## Phase C — 탐색 카드의 "내 항목" 시인성 강화
대상
- src/app/(main)/bands/BandsListPane.client.tsx
- src/app/(main)/performances/PerformancesListPane.client.tsx (Phase B 후)
- src/components/ui/my-item-marker.tsx (신규)

요건
- 디자인 제안: (i) 카드 우상단 "내 밴드" 작은 칩 (accent-soft 배경 + accent 글자) + (ii) 카드 좌측 2px accent 보더, (iii) 카드 hover 시 "이미 가입됨" 보조 텍스트
- 사용자 컨펌 의사결정 항목: 위 3가지 시각 단서 중 어느 조합을 채택할지 (구현 전 한 번 확인). 미응답 시 (i)+(ii) 채택
- "내 항목" 판정은 Task 2 의 useMyBands / useMyPerformances 결과 와 비교
- 모바일 카드는 chip 만 표시 (보더는 시각 노이즈)

## Phase D — 밴드 설정 모달 (정보 수정 / 사진 / 삭제)
대상
- 신규: src/domain/band/components/BandSettingsModal.client.tsx (Tabs 기반 — `정보`, `사진`, `삭제`)
- 신규: src/domain/band/api/{updateBand.ts, deleteBand.ts, uploadBandProfileImage.ts}
- 신규: src/domain/band/hooks/{useUpdateBand.ts, useDeleteBand.ts, useUploadBandProfileImage.ts}
- src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx — 헤더 "밴드 설정" 버튼 → 모달 트리거

요건
- 정보 수정: 이름/설명 PATCH (백엔드 미지원이면 API_REQUIRED.md FE-API-022 등록 + UI 만 우선 구현)
- 사진 변경: 멀티파트 업로드 또는 사전서명 URL — 미지원이면 URL 입력 폼 임시 유지 (FE-API-009 P2 항목 활성화)
- 삭제: DELETE /bands/{bandId} (백엔드 존재 가정 — 검증 후 미지원이면 등록)
- 권한: LEADER 만 노출 (RoleGuard role="LEADER")
- 삭제 확인 다이얼로그: 이중 확인 (input 으로 밴드명 재입력 후 활성)

## Phase E — DateTimePicker UX 보강
대상
- src/components/ui/date-time-picker.tsx
- 신규: src/components/ui/year-month-picker.tsx (캘린더 헤더 드롭다운)

요건 — 5-1: 연/월 빠른 선택
- 캘린더 헤더의 "2026년 4월" 영역을 클릭 가능하게
- 클릭 시 YearMonthPicker 팝오버: 연도 grid (현재±5년 12칸) + 월 grid (1~12 4×3). 키보드 ↑/↓/←/→ 이동 + Enter 확정 + Esc 닫기

요건 — 5-2: 시간 입력 대안 UI 제안 + 채택
- 사용자 컨펌 의사결정 항목: 다음 후보 중 채택 — 미응답 시 (a) 채택
  - (a) **두 컬럼 휠 + 입력 가능한 텍스트 박스 듀얼 모드** — 휠 위에 시·분 input 을 두고 직접 타이핑 가능, 휠은 보조
  - (b) **클럭 다이얼** — 라운드 시각 다이얼 (Material Time Picker 류) — 데스크톱 인지 비용 큼
  - (c) **24h × 4(15분) 슬라이더** — 시·분을 두 슬라이더로 — 정밀도 한계
- 채택안 구현. 휠은 유지하되 감도 보정(scroll snap-y mandatory + larger snap target) + 직접 입력 듀얼 모드

요건 — 5-3: 시작 / 소요 시간 시각 강조
- 마법사 메타 단계의 시작 시각 + 소요 시간을 두꺼운 카드 2 컬럼 그리드로 배치
- 텍스트는 success/accent 톤 (디자인 토큰), font-bold, text-title 사이즈
- 제목/장소 input 은 기존 작은 사이즈 유지

## Phase F — 마법사 검토(확정) 단계 + 표준 알림
대상
- src/app/(main)/practices/new/PracticeCreateWizard.client.tsx — Step 4 추가 ("검토 및 확정")
- src/app/(main)/performances/new/PerformanceCreateWizard.client.tsx (Phase B 결과)
- 신규: src/components/ui/wizard-summary-card.tsx (재사용 가능한 검토 패널)
- 신규: src/components/feedback/resource-created-modal.tsx 또는 기존 toast 시각 강화

요건
- 검토 패널: Section 4종 (밴드 / 곡 / 일정 / 메타) 각 Section 마다 "수정" 링크 → 해당 Step 으로 이동
- 디자인: 카드 + 라벨/값 + 우측 ⓘ 또는 ✎ 아이콘. 좌측 미리보기 (날짜·시간 강조 — Phase E-3 와 일관)
- 마지막 "합주 만들기 / 공연 만들기" 버튼이 실제 제출 트리거
- 제출 성공 시 ResourceCreatedModal (또는 강조 토스트): 배지 + 아이콘 + 한 줄 메시지 + 대상 페이지로 이동 버튼
- 제출 실패 시 기존 ErrorState 톤 토스트
- ResourceCreatedModal 은 시스템 전역에서 재사용 (밴드 생성, 합주곡 추가 등)

## Phase G — 마법사 밴드 선택 6 개 그리드 + 검색 통합
대상
- src/app/(main)/practices/new/PracticeCreateWizard.client.tsx Step 1
- 동일 패턴: 공연 마법사 Step 2 (참여 밴드)
- BandPickerModal (Task 5) 재사용

요건
- 카드 그리드 최대 6 개 표시 (useMyBands 페이지 1)
- "전체 보기 / 검색" 버튼 → BandPickerModal 오픈 (single 선택)
- 모달 결과 → 메인 그리드의 7번째 칸으로 추가 (이미 표시 중이면 무시)

## Phase H — 잔존 결함 정리
대상 — 7-1 카피 제거
- 마법사 헤더의 "밴드 → 곡 → 일정 순서로 진행합니다." 문구 삭제

대상 — 7-2 무한 스크롤 검증
- 밴드 / 합주 / 공연 / 멤버 / 가입 신청 목록의 페이징 동작 점검 (서버 페이지 사이즈 = 5 같이 작은 값으로도 다음 페이지 로드되는지)
- 필요 시 백엔드 `pageSize=2` 등 작은 값으로 5+ 페이지 채워 검증, `IntersectionObserver` 트리거 확인
- 결과는 `.taskmaster/reports/infinite-scroll-verification-2026-04-26.md`

대상 — 7-3 멤버 이름 표시
- 밴드 상세 멤버 탭에서 "멤버 #2718" 표시 케이스 분석
- 백엔드 `BandMemberInfoResponse` 가 `name` 을 포함하는지 실서버 응답 확인
- name 미포함이면 → API_REQUIRED FE-API-012 (이미 등록)에 실서버 검증 결과 반영
- name 포함이지만 누락 케이스(빈 문자열) 라면 → 프론트 폴백 룰 보강

대상 — 7-4 카드 선택 시각 강조
- 합주곡 카드 / 밴드 그리드 카드 선택 시 좌측 accent 보더 + 우측 ✓ 아이콘 + accent-dim 배경 일관 적용
- EntityPickerModal 결과 카드 일관 적용

대상 — 7-5 "(자작곡)" 라벨 제거
- 마법사 Step 2 의 "직접 입력 (자작곡)" → "직접 입력"

# Technical Constraints
- 신규 컴포넌트는 components/ui (도메인 무관) 또는 domain/{name}/components (도메인 결합) 에 둠
- 모든 모달은 ResponsiveSheet 위에 빌드 — 라이브러리 신규 의존 금지
- DirtyFormContext 는 (main) 레이아웃에 Provider 배치 — 페이지 단위 상태 클린업
- ResourceCreatedModal 도입 시 기존 toast.success 사용처를 강제 마이그레이션하지 않음 — 점진적
- Task 8 의 v3 검증에서 발견된 P0 (bandIds non-null) 는 이미 수정 완료, 본 라운드 회귀 X 확인

# Open Questions (사용자 컨펌 필요 — 미응답 시 default 채택)
1. Phase C — 내 항목 시각 단서 조합: (i)+(ii)+(iii) 모두 vs (i)+(ii)만 vs 다른 조합. **default: (i)+(ii)**
2. Phase E-2 — 시간 입력 대안 UI: (a) 듀얼 모드 / (b) 클럭 다이얼 / (c) 슬라이더. **default: (a) 듀얼 모드**
3. Phase F — 리소스 생성 알림 형태: 모달 vs 토스트. **default: 강조 토스트(아이콘+제목+CTA, 5초 자동 닫힘) — 모달은 사용자 흐름 끊김**

</PRD>
