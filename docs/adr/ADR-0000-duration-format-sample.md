# ADR-0000: 초 단위 시간 표기를 "N분 N초" 한국어 형식으로 통일 (sandbox 테스트용 샘플)

<!-- status: proposed -->

- **상태**: Proposed
- **작성일**: 2026-09-14
- **관련 이슈**: BD-000

## 배경 (Context)

aidev Phase E1(머지 후 ADR 갱신) 동작을 sandbox에서 확인하기 위한 샘플 ADR이다.
develop 반영 시 이 파일은 가져가지 않는다.

## 결정 (Decision)

초 단위 시간은 `formatDuration(seconds)`로만 "N분 N초" 형식으로 표기한다.

## 대안 (Considered Alternatives)

- **대안 A**: `mm:ss` 숫자 표기 — 사용자 대면 텍스트는 한국어라는 규칙과 맞지 않아 채택하지 않음

## 결과 (Consequences)

컴포넌트에서 시간 문자열을 직접 조립하지 않는다.

## 결과 (머지 후 갱신)

<!-- aidev:merge-outcome -->

`scripts/aidev/update-adr.mjs` 가 Phase E1에서 이 섹션을 채운다.
