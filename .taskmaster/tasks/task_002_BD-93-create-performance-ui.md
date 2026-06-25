# Task ID: 2

**Title:** Performance 도메인 API 정렬 및 fe-areas.json 정비

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** openapi.json 기준으로 performance 도메인 타입·API 파일 업데이트, 구 practice 관련 파일 제거, fe-areas.json 영역 정비(setlist·performance-poster 추가, practice knownGap 제거, specPending 지원)

**Details:**

No details provided.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 2.1. Performance 도메인 응답 타입(res.ts) BE 스펙 정렬

**Status:** pending  
**Dependencies:** None  

openapi.json의 Performance 관련 응답 스키마와 FE 타입을 1:1 정렬한다. PerformanceBandSummary에 members 필드 추가, PerformanceBandMemberSummary 타입 신규 정의, 기타 응답 타입 필드 정합성 검증 및 수정.

**Details:**

1. src/domain/performance/types/res.ts 수정:
   - PerformanceBandMemberSummary 타입 신규 추가 (userId: number, name: string, profileImg?: string, role: 'LEADER'|'ADMIN'|'MEMBER')
   - PerformanceBandSummary에 members: PerformanceBandMemberSummary[] 필드 추가
   - PerformanceListItemResponse → PerformanceListResponse로 타입명 변경 (BE 스펙 일치)
   - setlists: PerformanceSetlistSummary[] 필드 추가
   - CreatePerformanceResponse → PerformanceResponse로 타입명 변경 (BE 스펙 일치)
2. PerformanceInvitationResponse의 invitedMemberName/invitedMemberProfileImg를 optional에서 제거(BE에서 non-required)

### 2.2. Performance 도메인 요청 타입(req.ts) BE 스펙 정렬

**Status:** pending  
**Dependencies:** 2.1  

openapi.json의 Performance 관련 요청 스키마와 FE 타입을 정렬한다. CreatePerformanceRequest에서 불필요한 bandIds 제거, 스키마(schema.ts)도 함께 수정.

**Details:**

1. src/domain/performance/types/req.ts 수정:
   - CreatePerformanceRequest에서 bandIds?: string[] 필드 제거 (BE 스펙에 없음)
   - BE 스펙 필수 필드 확인: title(required), startAt(required), durationMinutes(required), setlistIds(optional), venue(optional)
2. src/domain/performance/types/schema.ts 수정:
   - createPerformanceSchema에서 bandIds 관련 스키마 라인 제거
3. src/domain/performance/types/index.ts 수정 (필요시):
   - export 목록이 변경된 타입명과 일치하는지 확인

### 2.3. Performance 도메인 구 practice 관련 파일 삭제 확정

**Status:** pending  
**Dependencies:** 2.1, 2.2  

git status에서 D(삭제) 표시된 practice 관련 API/hooks/components 파일들의 삭제를 git에 반영하고, 관련 export 및 import 정리.

**Details:**

1. 삭제 대상 파일 확인 (git status D 표시):
   - src/domain/performance/api/addPerformancePractice.ts
   - src/domain/performance/api/batchAddPerformancePractices.ts
   - src/domain/performance/api/removePerformancePractice.ts
   - src/domain/performance/components/PerformancePracticeRow.tsx
   - src/domain/performance/hooks/useAddPerformancePractice.ts
   - src/domain/performance/hooks/useBatchAddPerformancePractices.ts
   - src/domain/performance/hooks/useRemovePerformancePractice.ts
2. 해당 파일들 import/export 정리:
   - 다른 파일에서 위 모듈을 import하는 곳이 있으면 제거
   - barrel export(index.ts 등)에서 해당 export 제거
3. 삭제된 setlist/api/getMySetlists.ts는 setlist/api/index.ts로 통합되었으므로 확인만

### 2.4. fe-areas.json specPending 영역 정비 및 검증 스크립트 실행

**Status:** pending  
**Dependencies:** 2.3  

performance-poster 영역의 specPending 상태 유지 확인, setlist 영역 operationIds 보강, verify-fe-areas 스크립트로 MAP↔SPEC/CODE↔MAP 정합성 검증.

**Details:**

1. fe-areas.json 검토 및 수정:
   - setlist 영역에 operationIds 추가 (openapi.json 기준): createSetlist, getMySetlists, getSetlistByTitle, getSetlist, updateSetlist, createJamsFromSetlist, getSetlistTracks, getSetlistTrack, updateSetlistTrack, deleteSetlistTrack
   - performance-poster: specPending=true 유지 (BE 구현 완료이나 openapi.json 스냅샷 미반영 상태)
   - notification: specPending=true 유지 (동일 사유)
2. performance 영역 operationIds 보강 (현재 미설정):
   - getPerformances, createPerformance, getMyPerformances, searchPerformances, getPerformance, updatePerformance, deletePerformance, getMyInvitations, getPerformanceInvitations, sendInvitation, respondInvitation 등
3. pnpm verify:fe-areas 실행하여 PASS 확인

### 2.5. Performance/Setlist API 함수 BE 스펙 정렬 및 타입 적용

**Status:** pending  
**Dependencies:** 2.2, 2.3  

Performance 도메인의 API 함수들이 수정된 타입을 올바르게 사용하는지 검증하고, 필요시 API 함수 시그니처 수정. Setlist API 함수도 res.ts 타입과 정합성 확인.

**Details:**

1. src/domain/performance/api/*.ts 검토:
   - createPerformance.ts: CreatePerformanceRequest → bandIds 없이 호출하는지 확인
   - getPerformances.ts, getMyPerformances.ts: 반환 타입이 CursorResponse<PerformanceListResponse, string>과 일치하는지 확인
   - getPerformanceDetail.ts: 반환 타입이 PerformanceDetailResponse와 일치하는지 확인
2. src/domain/setlist/api/index.ts 검토:
   - 기존 getMySetlists가 제대로 export되고 있는지 확인 (삭제된 별도 파일 대체)
   - 모든 함수의 반환 타입이 setlist/types/res.ts와 일치하는지 확인
3. hooks에서 API 함수를 올바르게 사용하는지 검토 (usePerformanceList, useMyPerformances 등)
