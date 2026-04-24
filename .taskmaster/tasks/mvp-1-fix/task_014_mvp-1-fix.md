# Task ID: 14

**Title:** OAuth 로그인 화면 (빈 버튼: 카카오/구글/애플) 추가

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** /login 페이지의 이메일/비밀번호 폼 상단에, 아직 구현되지 않은 OAuth 로그인 섹션을 추가한다 (카카오/구글/애플 브랜드 버튼, onClick 은 disabled or toast '준비 중').

**Details:**

1) src/components/ui/oauth-button.tsx: provider('kakao'|'google'|'apple') 별 브랜드 색상/아이콘/라벨을 한 컴포넌트에 응축. 2) /login 페이지의 LoginForm.client 상단에 3개 버튼 세로 스택 + 'OR' 구분선(Divider + 가운데 '또는' 라벨) 렌더. 3) 현재 버튼은 onClick={() => toast.info('준비 중입니다')} 처리 + aria-disabled=false 로 클릭 가능하되 기능 없음 명시. 4) 모바일/데스크톱 모두 동일 컴포지션, 데스크톱에선 AuthFormPanel 480px 폭 내부 배치. 5) Playwright E2E: /login 에서 3개 provider 버튼 role=button 으로 존재 확인.

**Test Strategy:**

No test strategy provided.
