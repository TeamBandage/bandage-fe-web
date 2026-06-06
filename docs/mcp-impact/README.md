# MCP 영향평가 Tool — FE 연동 문서

BE/FE가 서로의 작업을 모른 채 개발하다 API 변경이 반대편을 깨뜨리는 문제를 막기 위해,
원격 MCP 서버에 **"스펙 diff 기반 BE/FE 영향 평가 Tool"** 을 도입한다.

- BE가 OpenAPI 스펙을 바꾸면 서버가 두 git ref를 diff 해 **breaking 변경**을 판정한다(BE 측).
- FE 작업자(또는 Agent)가 `check_impacting_changes(fe_area)` 를 호출하면 **"내 작업 영역에
  영향을 주는 최근 BE 변경"** 을 받는다.

이 디렉터리는 그 연동을 위한 FE 측 산출물을 모은다.

## 파일

| 파일 | 역할 |
|---|---|
| [`../../fe-areas.json`](../../fe-areas.json) | 영역(fe_area) 정의 + BE endpoint 매핑 (1단계 수동 맵) |
| [`area-status-policy.md`](./area-status-policy.md) | mock/미연동 영역의 영향 조회 처리 규칙 |
| [`agent-workflow.md`](./agent-workflow.md) | FE Agent의 자동 호출 시점/절차 |
| [`repo-access.md`](./repo-access.md) | 2단계 자동매핑을 위한 FE 리포 접근 조건 |
| [`../../scripts/verify-fe-areas.mjs`](../../scripts/verify-fe-areas.mjs) | 매핑 검증 스크립트 (`pnpm verify:fe-areas`) |

## 영역 단위 결정 — 도메인 모듈

`fe_area`는 **FE 도메인 모듈**(`src/domain/{name}`)을 단위로 한다. FE 도메인 구조가
BE 도메인 경계를 1:1 미러링하고, 각 도메인의 `api/` 함수가 쓰는 endpoint가 도메인별
prefix로 깔끔히 분리되기 때문에 "endpoint prefix → 영역" 매핑이 자연 성립한다.

라우트 그룹(`app/(main)/bands` 등)은 한 화면이 여러 도메인 API를 섞어 쓰므로 영향 단위로는
경계가 흐려진다. 따라서 라우트는 **사람이 읽는 별칭**(`routes` 필드)으로만 병기한다.

## `fe-areas.json` 스키마

```jsonc
{
  "version": 1,
  "areas": [
    {
      "id": "band",                          // 영역 식별자 = src/domain/{id}
      "label": "밴드",                        // 표시명
      "routes": ["/bands"],                  // 사람이 읽는 라우트 별칭(매핑엔 미사용)
      "endpointPrefixes": ["/api/v1/bands"], // 이 영역이 소비하는 BE endpoint prefix
      "status": "active",                    // active | partial-mock | mock-only
      "notes": "..."                         // (선택) 비고
    }
  ]
}
```

### endpoint → 영역 매핑 규칙

- endpoint 경로를 `endpointPrefixes`에 대해 **longest-prefix match** 로 귀속한다.
- 어떤 prefix에도 안 걸리는 endpoint = **uncovered** → 영역 정의 누락이므로 보강 대상.
- `endpointPrefixes`가 비고 `status: mock-only` 인 영역은 BE 미연동 → 매핑 없음이 정상.

## 영역 목록 (현재)

| id | label | routes | endpointPrefixes | status |
|---|---|---|---|---|
| auth | 인증 | /login, /join, /password-change, /oauth | /api/v1/auth | active |
| member | 회원 | /me | /api/v1/members | active |
| band | 밴드 | /bands | /api/v1/bands | active |
| practice | 합주 | /practices | /api/v1/practices, /api/v1/practice-songs | active |
| performance | 공연 | /performances | /api/v1/performances | active |
| setlist-meeting | 셋리스트 회의 | /setlist-meetings | /api/v1/setlist-meetings | partial-mock |
| schedule-coordination | 일정 조율 | /setlist-meetings/scheduling | (없음) | mock-only |

> practice-song은 BE에서 embedded 엔티티로 관리되어 별도 영역이 아닌 practice 영역에 귀속한다.

## 유지보수

- 이 맵은 **FE가 PR로 관리**한다. 신규 도메인 추가/endpoint prefix 변경 시 `fe-areas.json`을
  같은 PR에서 갱신한다.
- 변경 후 `pnpm verify:fe-areas` 로 코드의 실제 endpoint 사용과 맵의 정합성을 검증한다.
- 2단계(자동매핑)에서는 이 수동 맵을 검증 기준(ground truth)으로 재사용한다.
