# OpenAPI 타입 생성 (openapi-typescript) — 도입 가이드

BE OpenAPI 스펙으로부터 FE 타입을 생성해 **컴파일 단계 안전망**을 확보하고, MCP 영향평가
Tool의 **operationId 기반 매핑** 기반을 마련한다.

- 생성기: `openapi-typescript@7.13.0` (devDependency)
- 입력 스펙(벤더 스냅샷): `openapi/openapi.json` — Bandage API, OpenAPI 3.1.0, 74 paths,
  **101개 고유 operationId**
- 출력: `src/global/api/schema.d.ts` (생성물, 직접 편집 금지)
- 접근 헬퍼: `src/global/api/openapi.ts`

## 명령

```bash
pnpm gen:api          # openapi/openapi.json → src/global/api/schema.d.ts 재생성
```

### 벤더 스냅샷 갱신

`openapi/openapi.json` 은 BE 스펙의 스냅샷이다(BE 미실행 환경에서도 재현 가능하도록 벤더링).
BE 스펙이 바뀌면 갱신한다.

```bash
# A) BE 서버 실행 중일 때
curl -s http://localhost:8080/v3/api-docs -o openapi/openapi.json && pnpm gen:api
# B) BE 리포 스냅샷에서
cp ../bandage-band-manager/docs/openapi.json openapi/openapi.json && pnpm gen:api
```

## 사용 (1차 — 타입만, DTO 비치환)

기존 수기 DTO(`domain/{name}/types`)는 **치환하지 않는다.** 신규/위험 호출부에서 생성 타입을
안전망으로 점진 사용한다.

```ts
import type { ApiRequestBody, ApiResponseBody, Schemas } from '@/global/api/openapi';

type CreateBandBody = ApiRequestBody<'createBand'>;   // BandCreateRequest
type CreateBandRes = ApiResponseBody<'createBand'>;    // ApiResponseBandResponse (래퍼 포함)
type BandInfo = Schemas['BandInfoResponse'];           // 이름이 일치하는 스키마는 직접 사용
```

## 중요 — 스키마명이 FE DTO명과 1:1로 일치하지 않음 (확인된 사실)

생성된 컴포넌트 스키마명은 FE 수기 DTO명과 다르다. 단순 rename 치환이 **부분만** 가능하다.

| FE 수기 DTO | BE 스펙 스키마 | 비고 |
|---|---|---|
| `BandInfoResponse` | `BandInfoResponse` | 일치 |
| `CreateBandRequest` | `BandCreateRequest` | 이름 불일치 |
| `CreateBandResponse` | `BandResponse`(→ `ApiResponseBandResponse` 래퍼) | 불일치 |
| `CursorResponse<BandInfoResponse>` | `CursorResponseBandInfoResponseUUID` | 제네릭 mangling |

→ DTO 치환은 이름 매칭이 아니라 **operationId 기반**으로 진행해야 안전하다.
   (operationId는 101개 전부 고유 → 안정적 조인 키)

## 2단계 — DTO 점진 치환 (개발자 지시 대기)

수기 DTO를 생성 타입으로 치환하는 작업은 범위가 크고 호출부 영향이 있어 **별도 지시 시 착수**한다.
권장 순서: operationId → 도메인 `api/*.ts` 의 요청/응답 타입을 `ApiRequestBody`/`ApiResponseBody`
로 교체 → 깨지는 호출부 수정 → 수기 DTO 제거.

## 후속 점검 항목 (영향평가 Tool 후보)

스펙 대조 중 발견된 BE/FE 잠재 불일치 — 본 태스크 범위 밖, 별도 확인 필요:

- **[높음] practices ↔ jams 경로 발산**: 벤더 스냅샷(`openapi/openapi.json`)에는
  `/api/v1/practices` 가 **존재하지 않고** `/api/v1/jams/*` 가 있다. 그러나 FE practice
  도메인(`domain/practice/api/*`)은 `/api/v1/practices/*` 를 호출한다. 스냅샷과 FE 빌드
  기준 스펙의 버전 차이일 수 있으므로 **방향(어느 쪽이 최신인지)은 BE/실서버로 확인 필요**.
  확정 시 한쪽을 정렬해야 한다.
- `createBand` 는 스펙상 `memberId` **query 파라미터를 요구**하나, FE
  `domain/band/api/createBand.ts` 는 이를 전달하지 않는다. 실서버 검증 시 확인 요망.

> 위 항목들은 MCP 영향평가 Tool이 자동 검출하려는 대상의 실제 사례다.
