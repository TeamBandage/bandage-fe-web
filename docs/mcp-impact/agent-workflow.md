# FE Agent 워크플로우 — 영향 조회 자동 편입

`check_impacting_changes` 는 적절한 시점에 호출돼야 값을 가진다. FE는 **수동 호출**이 아니라
**Agent 워크플로우에 자동 편입**하는 방식을 택한다. 도메인 작업에 진입할 때 Agent가 해당
`fe_area`를 스스로 판정해 호출한다.

## 트리거 — 언제 호출하는가

FE Agent는 다음 시점에 영향 조회를 **선행**한다.

1. **도메인 작업 시작 시**: 사용자가 특정 도메인/화면 작업을 지시하면, 구현 착수 **전에**
   해당 영역으로 `check_impacting_changes(fe_area)` 를 1회 호출한다.
2. **작업 파일이 여러 영역에 걸칠 때**: 관련된 모든 영역에 대해 각각 호출한다.
3. **BE 변경 의심 신호**: 타입 불일치/빌드 깨짐/4xx 응답을 만나면 해당 영역을 재조회한다.

## 영역(fe_area) 판정 규칙

작업 대상 파일 경로 → 영역 식별자(`fe-areas.json`의 `id`)로 환원한다.

| 작업 경로 패턴 | 영역 판정 |
|---|---|
| `src/domain/{id}/**` | `{id}` 를 그대로 영역으로 |
| `src/app/**` 라우트 | `fe-areas.json` 의 `routes` 와 longest-prefix match |
| 컴포넌트가 호출하는 endpoint | `endpointPrefixes` longest-prefix match 로 영역 역산 |

`mock-only` 영역(예: schedule-coordination)은 호출해도 "미연동"이 반환되므로 생략 가능하다.
(상태별 동작은 [area-status-policy.md](./area-status-policy.md) 참조)

## 절차

```
1. 작업 지시 수신
2. 대상 영역 판정 (위 규칙)
3. check_impacting_changes(fe_area) 호출
4. 결과 해석
   - breaking 변경 있음 → 사용자에게 보고하고 구현 계획에 반영 (타입/호출부 선반영)
   - 영향 없음        → 정상 진행
   - 미연동(mock-only) → 안내만, 진행
5. 구현
```

## 결과 처리 원칙

- breaking 변경이 보고되면 **임의로 무시하지 않는다.** 사용자에게 요약 보고 후 대응을
  계획에 포함한다(영향받는 `src/domain/{id}/api/*`, `types/req.ts`·`res.ts` 우선 점검).
- 조회는 보조 신호다. 최종 검증은 빌드/타입체크/실서버 검증 절차로 확정한다.

## 비고

이 절차는 프로젝트 `CLAUDE.md` 에서 참조한다. 절차 변경 시 이 문서를 갱신한다.
