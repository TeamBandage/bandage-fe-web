# .aidev — Phase C/D/E 자동화

앞단(Phase A·B)에서 만든 스펙·구현 계획·태스크(Jira 이슈 + json)를 받아
Phase C(개발) → D(검증) → Gate 3(사람 머지 승인) → E(반영)까지 자동으로 이어간다.

## 입력 계약 — `.aidev/inbox/<BD-번호>/`

| 파일        | 내용                                   |
| ----------- | -------------------------------------- |
| `spec.md`   | 스펙 (Phase A 산출물)                  |
| `plan.md`   | 구현 계획 (Phase B 산출물)             |
| `task.json` | 아래 스키마 — `.aidev/templates/task.json` 복사해서 사용 |

```jsonc
{
  "issueKey": "BD-123", // Jira 이슈 키 (폴더 이름과 같아야 함)
  "title": "셋리스트 타임테이블 겹침 처리", // 커밋/PR 제목
  "type": "feat", // feat | fix | chore | refactor | docs | test | style | perf
  "branchBase": "develop", // 브랜치를 딸 기준 브랜치
  "adrPath": "docs/adr/ADR-0007-setlist-timetable.md" // 선택. E1이 머지 후 갱신
}
```

## 흐름

1. `.aidev/inbox/<BD-번호>/`에 산출물이 들어온다 (커밋된 상태)
2. 로컬에서 `pnpm aidev:dev <BD-번호>` — C1 구현 → C2 자가 검증 → C3 PR 생성
3. GitHub Actions `aidev_gate.yml` — D1 자동 검사(lint·typecheck·test·coverage·secret-scan) → D2 Gemini 리뷰
4. 실패·반려가 나면 워크플로우가 ntfy.sh로 신호를 보내고, 로컬에 켜둔 `pnpm aidev:watch`가 받아 재시도
5. 사람이 리뷰 승인 + 머지 (Gate 3, 브랜치 보호로 강제)
6. 머지되면 `aidev_post_merge.yml` — E1 ADR 결과 갱신 → E2 메트릭 기록

## 재시도 규칙 — 무한 루프 방지

네 갈래 실패가 **카운터 하나**를 공유한다. 상한은 `scripts/aidev/config.mjs`의 `MAX_RETRY`(현재 5).
최초 1회 + 재시도 5회 = 태스크당 `claude -p` 최대 6회.

| 실패 | 누가 감지 | 신호 |
| --- | --- | --- |
| C2 자가 검증 실패 | `dev-agent.mjs` 자체 루프 | (같은 프로세스) |
| D1 자동 검사 실패 | GitHub Actions → `watch-review.mjs` | ntfy `CI_FAILED` |
| D2 Gemini 반려 | `gemini-review.mjs` → `watch-review.mjs` | ntfy `REQUEST_CHANGES` |
| Gate 3 사람 반려 | `aidev_human_review.yml` → `watch-review.mjs` | ntfy `HUMAN_CHANGES_REQUESTED` |

상한을 넘기면 `escalate.mjs`가 **자동화 중단 · 사람 인계**를 한다 — PR draft 전환, `needs-human` 라벨,
Slack 알림, 그리고 `state.json`에 `escalated: true`를 기록해 이후 신호가 와도 다시 집지 않는다.

### 테스트 수정 금지

`dev-agent.mjs`는 매 실행 전 **이미 커밋된 테스트 파일**(`*.test.ts(x)`, `*.test.mjs`, `*.spec.ts`)을
떠 두고, 에이전트가 고쳤으면 원본으로 되돌린 뒤 그 사실을 실패 사유로 넣어 재시도한다.
실패를 없애는 가장 쉬운 길이 테스트 수정이라 막지 않으면 자가 검증이 장식이 된다.
새 테스트 파일 추가는 자유다.

## 로컬 상태 — `.aidev/inbox/<BD-번호>/state.json`

`dev-agent`·`watch-review`가 쓰는 로컬 전용 파일이다(**gitignore됨**). 브랜치를 오가며 충돌하지
않도록 커밋하지 않고, 머지 후 CI가 필요한 메트릭(재시도 횟수·Claude 사용량)은 PR 본문 끝의
`<!-- aidev-metrics {...} -->` 마커로 전달한다.

```jsonc
{
  "retryCount": 0,
  "tokenUsedUsd": 0,
  "lastFailure": null, // 다음 재시도 프롬프트에 주입되는 실패 사유
  "lastHandledReviewId": null, // 같은 사람 반려로 중복 재시도하지 않도록
  "prUrl": null,
  "escalated": false
}
```

처음부터 다시 돌리려면 이 파일을 지우면 된다.

## 테스트해 보기

```bash
# 1) 프롬프트만 확인 (Claude 호출·git 조작 없음)
pnpm aidev:dev BD-000 --dry-run

# 2) 실제 실행 — .aidev/ 밖에 커밋 안 된 변경이 있으면 시작하지 않는다
pnpm aidev:dev BD-000

# 3) 반려 신호 대기 (터미널 하나 띄워두기)
NTFY_TOPIC=<시크릿과 같은 값> pnpm aidev:watch
```

## 시크릿 · 환경변수

| 이름 | 어디에 | 용도 |
| --- | --- | --- |
| `GEMINI_API_KEY` | GitHub 저장소 시크릿 | D2 Gemini 리뷰 |
| `NTFY_TOPIC` | GitHub 저장소 시크릿 **+** 로컬 환경변수 (같은 값) | 실패·반려 신호. 추측 불가능한 임의 문자열 (`openssl rand -hex 16`) |
| `SLACK_WEBHOOK_URL` | 로컬 환경변수 (선택) | 자동화 중단 알림 |
