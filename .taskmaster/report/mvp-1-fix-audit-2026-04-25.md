# MVP 1차 보정 감사 리포트

- 작성일: 2026-04-25
- 브랜치 / 머지 PR: #41 Tokens, #42 Shell, #43 (main) Layout, #44 Auth Split, #46 Onboarding, #47 Common Components, #48 Home, #49 Band Master-Detail, #50 Practice/Performance/Me, #51 Mobile Audit (본 PR)
- 대상: 모바일(360/375) / 태블릿(961) / 데스크톱(1440) 뷰포트

## 1. 뷰포트별 검증

| 뷰포트 | Sidebar | BottomNav | AuthBrand | 비고 |
|---|---|---|---|---|
| 1440x900 | 표시 | 숨김 | 표시(/auth) | 정상 |
| 961x820 | 표시(lg 경계) | 숨김 | 표시 | 정상 |
| 959x? | 숨김(lg 경계 직전) | 표시 | 숨김 | 정상 |
| 375x812 | 숨김 | 표시 | 숨김 | 정상 |
| 360x780 | 숨김 | 표시 | 숨김 | 정상 |

## 2. 모바일 터치 타깃
- Onboarding CTA [시작하기]: h-12 (48px) ≥ 40px 기준 충족
- BottomNav 각 탭: h-14 (56px) 영역, 아이콘 + 라벨 포함
- PasswordStrength label: 터치 대상 아님 (시각 전용)

## 3. 타이포그래피 / 패딩
- 본문 기본 `text-body` = 14px
- PageTitle: 모바일 20px / 데스크톱 26~28px (기존 CSS 토큰 적용)
- Container 패딩 3단: `px-s-4(16)` / `md:px-s-5(20)` / `lg:px-7(28)`

## 4. 잔여 이슈 / 추후 작업
- HomeStatCards 의 "참여 세션" 수치: list API 미제공으로 누락 — Task 11 이후 별도 summary 엔드포인트 고려
- Performance list 의 startAt 원문 표시 — formatInTimeZone 적용 필요 (Task 11 외 후속)
- /me 는 좌측 메뉴 없이 단일 폼; PaneList + PaneDetail master-detail 은 정보량 증가 시 재검토

## 5. 테스트 스위트
- Unit: 44 / 44 통과
- E2E: viewport-audit 포함 28 시나리오, /playground/layout 및 /onboarding 포함 전체 그린
