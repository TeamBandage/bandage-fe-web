# Task ID: 13

**Title:** 한글 줄바꿈(word-break) 점검 및 보정

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** 긴 한국어 문장이 컴포넌트 폭에 맞춰 단어 중간에서 어색하게 끊기지 않도록 word-break/keep-all 정책을 적용한다.

**Details:**

1) globals.css 에 한국어 기본 정책 추가: body { word-break: keep-all; overflow-wrap: break-word; } (CJK 친화). 2) 개별 긴 문구가 있는 곳(AuthBrand tagline, OnboardingHero tagline, OnboardingFeatures description, EmptyPane description, ErrorState description) 등 점검 후 필요 시 keep-all / break-keep Tailwind 유틸 추가. 3) 확인 대상 뷰포트: 360/375/960 — Playwright 스크린샷 1장씩 찍어 회귀 방지. 4) PRD/리포트에 영향받는 문장 목록 및 적용 여부 정리.

**Test Strategy:**

No test strategy provided.
