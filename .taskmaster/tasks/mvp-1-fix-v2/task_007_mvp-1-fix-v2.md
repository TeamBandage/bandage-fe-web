# Task ID: 7

**Title:** Phase G: UUID 비노출 및 멤버 표기 정상화

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** BandMemberRow, BandApplicationRow, 참여자 카드 등에서 'Member #{fullUUID}' 대신 name 필드 사용, name 부재 시 '멤버 #{UUID 마지막 4자리}' 폴백 적용, 식별자 텍스트 노출 완전 제거

**Details:**

1. 변경 대상 컴포넌트:
   - src/domain/band/components/BandMemberRow.tsx
   - src/domain/band/components/BandApplicationRow.tsx
   - src/domain/practice/components/* 참여자 관련

2. 멤버 이름 표시 로직:
   ```tsx
   function getMemberDisplayName(member: { memberId: string; name?: string }) {
     if (member.name) return member.name;
     const shortId = member.memberId.slice(-4);
     return `멤버 #${shortId}`;
   }
   ```

3. BandMemberRow.tsx 수정:
   - L45: `Member #{member.memberId}` → `getMemberDisplayName(member)`
   - L46: `id: {member.bandMemberId}` 줄 삭제 (key prop으로만 사용)

4. BandApplicationRow.tsx 수정:
   - L33-34: 동일하게 displayName 함수 적용
   - L36: bandApplicationId 텍스트 표시 삭제

5. 참여자 카드:
   - PracticeDetailContent의 참여자 섹션 확인
   - participantId, sessionId 등 식별자 텍스트 모두 삭제

6. API_REQUIRED.md 업데이트:
   - FE-API-012: BandMemberInfoResponse에 name, profileImg 포함 요청
   - FE-API-013: BandApplicationInfoResponse에 applicantName, applicantProfileImg 포함

**Test Strategy:**

1. 멤버 목록에서 UUID 전체가 보이지 않는지 확인
2. name 필드 있는 경우 이름 표시 확인
3. name 필드 없는 경우 '멤버 #XXXX' 폴백 확인
4. 전체 코드베이스에서 UUID 노출 검색 (grep으로 확인)
5. 토스트/다이얼로그에서도 UUID 미노출 확인

## Subtasks

### 7.1. getMemberDisplayName 유틸 함수 생성

**Status:** pending  
**Dependencies:** None  

멤버 이름 표시 로직을 중앙화하는 유틸리티 함수를 src/domain/member/utils/getMemberDisplayName.ts에 생성합니다. name 필드가 있으면 name을 반환하고, 없으면 '멤버 #XXXX' (UUID 마지막 4자리) 폴백을 적용합니다.

**Details:**

1. src/domain/member/utils/ 디렉토리가 없으면 생성
2. getMemberDisplayName.ts 파일 생성:
   - 함수 시그니처: getMemberDisplayName(member: { memberId: string | number; name?: string | null }): string
   - 로직: name이 truthy하면 name 반환, 아니면 memberId를 string으로 변환 후 slice(-4)로 마지막 4자리 추출하여 '멤버 #XXXX' 반환
3. src/domain/member/utils/index.ts에서 export
4. 단위 테스트 작성 (선택): name 있는 경우, name 없는 경우, memberId가 number인 경우 테스트

### 7.2. BandMemberRow 및 BandApplicationRow UUID 비노출 적용

**Status:** pending  
**Dependencies:** 7.1  

src/domain/band/components/BandMemberRow.tsx와 BandApplicationRow.tsx에서 'Member #{fullUUID}' 및 'id: {bandMemberId}' 텍스트를 getMemberDisplayName 유틸로 교체하고, 식별자 노출을 완전히 제거합니다.

**Details:**

BandMemberRow.tsx 수정:
1. getMemberDisplayName import 추가
2. L45: 'Member #{member.memberId}' → getMemberDisplayName({ memberId: String(member.memberId), name: member.name })
3. L46: 'id: {member.bandMemberId}' 줄 삭제 (key prop은 유지)
4. L71 Dialog 본문: 'Member #{member.memberId} 에게' → '{getMemberDisplayName(...)} 에게'
5. L43 Avatar fallback: 'M${member.memberId}' → member.name?.charAt(0) || 'M'

BandApplicationRow.tsx 수정:
1. getMemberDisplayName import 추가
2. L34: 'Member #{application.memberId}' → getMemberDisplayName({ memberId: String(application.memberId), name: application.applicantName })
3. L36: '{application.bandApplicationId}' 텍스트 노출 삭제
4. L31 Avatar fallback 동일 수정

### 7.3. Practice 참여자 및 SessionRow UUID 비노출 적용

**Status:** pending  
**Dependencies:** 7.1  

PracticeDetailContent.client.tsx의 참여자 목록과 SessionRow.tsx의 세션 담당자 표시에서 'Member #{memberId}' 및 '{participantId}' 식별자 노출을 getMemberDisplayName 유틸로 교체합니다.

**Details:**

PracticeDetailContent.client.tsx 수정:
1. getMemberDisplayName import 추가
2. L207: 'Member #{p.memberId}' → getMemberDisplayName({ memberId: String(p.memberId), name: p.name })
3. L208: '{p.participantId}' 텍스트 span 삭제
4. 참여자 li 태그의 key는 p.participantId 유지

SessionRow.tsx 수정:
1. getMemberDisplayName import 추가
2. L55: '담당: Member #{session.participant!.memberId}' → '담당: {getMemberDisplayName({ memberId: String(session.participant!.memberId), name: session.participant!.name })}'

타입 확인: PracticeParticipantResponse, PracticeSessionResponse에 name 필드가 없으면 타입 파일에 optional name 필드 추가 필요 (백엔드 API 응답과 일치시 API_REQUIRED.md에 기록)

### 7.4. 타입 정의 업데이트 및 API_REQUIRED.md 문서화

**Status:** pending  
**Dependencies:** 7.1  

BandMemberInfoResponse, BandApplicationInfoResponse, PracticeParticipantResponse 등의 타입에 name, profileImg 필드를 optional로 추가하고, API_REQUIRED.md에 백엔드 요청 사항을 명세합니다.

**Details:**

타입 업데이트:
1. src/domain/band/types/res.ts:
   - BandMemberInfoResponse에 name?: string; profileImg?: string; 추가
   - BandApplicationInfoResponse에 applicantName?: string; applicantProfileImg?: string; 추가
2. src/domain/practice/types/res.ts:
   - PracticeParticipantResponse에 name?: string; 추가
   - PracticeSessionResponse.participant 타입에 name?: string; 추가

API_REQUIRED.md 업데이트 (기존 항목 8번 보강):
- FE-API-012: BandMemberInfoResponse에 name, profileImg 필드 포함 요청 상세화
- FE-API-013: BandApplicationInfoResponse에 applicantName, applicantProfileImg 필드 포함 요청
- FE-API-014: PracticeParticipantResponse 및 PracticeSessionResponse.participant에 name 필드 포함 요청

전체 코드베이스 grep으로 'Member #', 'memberId}', 'participantId}' 등 UUID 노출 패턴 최종 점검
