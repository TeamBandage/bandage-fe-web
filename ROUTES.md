# ROUTES

현재 `develop` 브랜치에서 접근 가능한 페이지 엔드포인트. 새 페이지를 추가/제거할 때 이 문서도 함께 업데이트해 주세요.

## 기본 실행

```bash
pnpm dev --port 3100    # 포트 3000이 점유 중이면 다른 포트 사용
```

아래 URL은 `http://localhost:3100` 기준입니다.

## Public

| 경로 | 설명                                                             | 구현 Task |
| ---- | ---------------------------------------------------------------- | --------- |
| `/`  | Next.js 템플릿 기본 페이지 (Task 10에서 홈 대시보드로 교체 예정) | —         |

## Playground (디자인/컴포넌트 검증)

| 경로                     | 설명                                                                               | 구현 Task     |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------- |
| `/playground`            | Tailwind v4 `@theme` 디자인 토큰(색상·반경·그림자·애니메이션·타이포) 시각 검증     | #2 (Issue #4) |
| `/playground/components` | UI 프리미티브(Button/Input/Card/Dialog/BottomSheet/Tabs 등) variant·size 조합 데모 | #4 (Issue #6) |

## (main) 탭 레이아웃 — BottomNav 공통 적용

| 경로            | 설명                                                                  | 구현 Task                 |
| --------------- | --------------------------------------------------------------------- | ------------------------- |
| `/home`         | 홈 탭 플레이스홀더 (Task 10에서 대시보드로 교체)                      | #5 (Issue #7) placeholder |
| `/bands`        | 밴드 탭 플레이스홀더 (Task 7에서 구현)                                | #5 placeholder            |
| `/practices`    | 합주 탭 플레이스홀더 (Task 8에서 구현)                                | #5 placeholder            |
| `/performances` | 공연 탭 플레이스홀더 (Task 9에서 구현)                                | #5 placeholder            |
| `/me`           | 마이페이지 플레이스홀더 (Task 6에서 프로필/로그아웃/탈퇴 등으로 교체) | #5 placeholder            |

> 참고: `/home`, `/bands`, `/practices`, `/performances`, `/me` 는 Task 6 (Issue #8) 머지 이후 Auth Guard 미들웨어로 보호됩니다. 미인증 상태에서 접근 시 `/login?from=<원래 경로>` 로 리다이렉트됩니다.

## (auth) — Task 6 머지 이후 활성화 예정

| 경로               | 설명                                  | 구현 Task     |
| ------------------ | ------------------------------------- | ------------- |
| `/login`           | 이메일·비밀번호 로그인                | #6 (Issue #8) |
| `/join`            | 회원가입 (가입 후 자동 로그인 시도)   | #6            |
| `/password-change` | 비밀번호 변경 (성공 시 재로그인 요구) | #6            |

## 백엔드 의존

- **현재 단계 (develop)**: 로컬 Spring 백엔드가 없어도 위의 모든 페이지가 정상 렌더됨 (API 호출 없음)
- **Task 6 머지 이후**: `/login`, `/join`, `/password-change`, `/me` 는 `/api/v1/*` 호출이 필요하므로 로컬에서 확인하려면 Bandage Spring 백엔드를 `http://localhost:8080` 에 기동해야 함
