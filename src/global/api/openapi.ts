/**
 * BE OpenAPI 스펙(openapi/openapi.json)에서 생성된 타입(`schema.d.ts`)에 대한
 * 얇은 접근 헬퍼. 생성물은 `pnpm gen:api` 로 갱신한다.
 *
 * 1차 도입 단계에서는 기존 수기 DTO(domain/{name}/types)를 치환하지 않고, 신규/위험
 * 호출부에서 점진적으로 이 타입을 안전망으로 사용한다. BE 스키마 컴포넌트명은 FE 수기
 * DTO명과 1:1로 일치하지 않으므로(예: CreateBandRequest ≠ BandCreateRequest, 응답은
 * ApiResponse* 래퍼로 mangling), **operationId 기반**(ApiRequestBody/ApiResponseBody)
 * 추출을 권장한다. operationId는 101개가 전부 고유해 안정적인 조인 키다.
 */
import type { paths, operations, components } from './schema';

export type { paths, operations, components };

/** 생성된 OpenAPI 컴포넌트 스키마. 이름이 일치하는 경우 직접 사용 가능(예: Schemas['BandInfoResponse']). */
export type Schemas = components['schemas'];

/** operationId의 JSON 요청 바디 타입. 요청 바디가 없으면 never. */
export type ApiRequestBody<Op extends keyof operations> = operations[Op] extends {
  requestBody: { content: { 'application/json': infer Body } };
}
  ? Body
  : never;

/** operationId의 200 JSON 응답 타입(ApiResponse 래퍼 포함). 200이 없으면 never. */
export type ApiResponseBody<Op extends keyof operations> = operations[Op]['responses'] extends {
  200: { content: { 'application/json': infer Res } };
}
  ? Res
  : never;
