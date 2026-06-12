# FE 리포 접근 조건 — 2단계 자동매핑

2단계(endpoint↔영역 자동매핑)에서 MCP 서버가 FE 코드를 정적 분석하려면 FE 리포를 읽을 수
있어야 한다. 1단계(수동 맵 `fe-areas.json`)에서는 불필요하다.

## 현재 상태 (확인된 사실)

| 항목        | 값                                                     |
| ----------- | ------------------------------------------------------ |
| 리포        | `TeamBandage/bandage-fe-web`                           |
| URL         | https://github.com/TeamBandage/bandage-fe-web          |
| 가시성      | **PUBLIC** (`gh repo view ... --json visibility` 확인) |
| 기본 브랜치 | `develop`                                              |

## 함의 — 별도 접근권 확보 불필요

리포가 **public**이므로 MCP 서버는 인증 없이 clone/read 할 수 있다. 당초 우려했던
"private 리포 접근권(deploy key/GitHub App) 확보" 작업은 **현재 불필요**하다.

MCP 서버에 전달할 정보는 다음으로 충분하다.

- clone URL: `https://github.com/TeamBandage/bandage-fe-web.git`
- 분석 기준 ref: `develop` (기본 브랜치) — 또는 분석 시점의 특정 커밋 SHA로 핀 고정 권장
- 분석 대상 경로: `src/domain/**/api/**`, `src/app/**`, `fe-areas.json`

## 향후 private 전환 시 (조건부)

리포가 private으로 바뀌면 그때 아래를 확보한다.

- **권장**: GitHub App 설치(조직 단위, contents:read) — 토큰 회전·세분 권한 관리 용이
- **대안**: 읽기 전용 deploy key — 단일 리포 한정

## 비고

- public 노출 정책상 비밀/키는 리포에 절대 커밋하지 않는다(기존 원칙 유지). MCP 서버가
  public 리포를 읽는다는 사실이 새로운 비밀 노출 경로를 만들지 않는지만 점검하면 된다.
- 분석은 정적(읽기 전용)이며 FE 리포에 쓰기 권한은 필요 없다.
