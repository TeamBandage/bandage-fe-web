# Task ID: 7

**Title:** 비밀번호 강도 카피 단순화

**Status:** pending

**Dependencies:** None

**Priority:** low

**Description:** PasswordStrength 컴포넌트의 라벨을 `약함 / 보통 / 강함` 3단계 단순 라벨로 축약하고, 부연 설명 문장을 제거한다.

**Details:**

**수정 대상: `src/components/ui/password-strength.tsx`**

```ts
// Before
const LABEL_MAP: Record<PasswordStrengthLevel, string> = {
  empty: '8자 이상, 대·소문자·숫자·특수문자 조합 권장',
  weak: '약함 — 8자 이상 및 대소문자/숫자/특수문자 중 2개 이상 포함 권장',
  medium: '보통 — 대소문자/숫자/특수문자 모두 포함하면 강함으로 승격',
  strong: '강함 — 안전한 비밀번호입니다',
};

// After
const LABEL_MAP: Record<PasswordStrengthLevel, string> = {
  empty: '비밀번호를 입력하세요',
  weak: '약함',
  medium: '보통',
  strong: '강함',
};
```

**유지 사항:**
- 색상 토큰 (weak=danger, medium=warn, strong=success) 유지
- 4-segment progress bar 유지
- aria 라벨 유지
- score 평가 로직 (`evaluatePassword`) 변경 없음
- `PasswordStrengthProps` 인터페이스 비파괴

**Test Strategy:**

1. 회원가입 페이지 (`/join`) 에서 비밀번호 입력 시 라벨 확인
2. 비밀번호 변경 페이지 (`/password-change`) 에서 라벨 확인
3. 각 강도 (empty, weak, medium, strong) 에 따른 라벨 및 색상 확인
4. progress bar 동작 정상 확인
5. `pnpm typecheck && pnpm lint` 통과

## Subtasks

### 7.1. LABEL_MAP 라벨 텍스트 단순화 수정

**Status:** pending  
**Dependencies:** None  

password-strength.tsx 파일의 LABEL_MAP 상수에서 각 레벨별 부연 설명을 제거하고 단순 라벨로 변경한다.

**Details:**

src/components/ui/password-strength.tsx 파일에서 LABEL_MAP 상수를 다음과 같이 수정:
- empty: '8자 이상, 대·소문자·숫자·특수문자 조합 권장' → '비밀번호를 입력하세요'
- weak: '약함 — 8자 이상 및 대소문자/숫자/특수문자 중 2개 이상 포함 권장' → '약함'
- medium: '보통 — 대소문자/숫자/특수문자 모두 포함하면 강함으로 승격' → '보통'
- strong: '강함 — 안전한 비밀번호입니다' → '강함'

기존 코드(24-29행)를 수정하되, 색상 토큰(SEG_COLOR, LABEL_COLOR), 4-segment progress bar, aria 라벨, evaluatePassword 함수, PasswordStrengthProps 인터페이스는 변경하지 않는다.

### 7.2. 스냅샷 테스트 파일 업데이트

**Status:** pending  
**Dependencies:** 7.1  

라벨 변경으로 인해 기존 스냅샷 테스트가 실패하므로 스냅샷을 업데이트한다.

**Details:**

src/components/ui/__snapshots__/password-strength.test.tsx.snap 파일의 스냅샷이 변경된 라벨을 반영하도록 업데이트:
- 기존: '강함 — 안전한 비밀번호입니다'
- 변경: '강함'

`pnpm test -- --update` 또는 Vitest의 `-u` 플래그를 사용하여 스냅샷을 갱신한다. 갱신 후 스냅샷 파일의 변경 내용이 예상과 일치하는지 확인한다.

### 7.3. 회원가입 페이지 비밀번호 강도 UI 시각 검증

**Status:** pending  
**Dependencies:** 7.1  

회원가입 페이지(/join)에서 비밀번호 입력 시 변경된 라벨이 올바르게 표시되는지 확인한다.

**Details:**

개발 서버(pnpm dev)를 실행하고 /join 페이지에 접속하여 다음 시나리오를 수동 테스트:
1. 비밀번호 필드 비어있을 때: '비밀번호를 입력하세요' 표시, text-foreground-muted 색상
2. 약한 비밀번호 입력 시(예: 'ab'): '약함' 표시, text-danger 색상, 0~1개 세그먼트 활성화
3. 보통 비밀번호 입력 시(예: 'Abcdefg1'): '보통' 표시, text-warn 색상, 3개 세그먼트 활성화
4. 강한 비밀번호 입력 시(예: 'Abcdefg1!'): '강함' 표시, text-success 색상, 4개 세그먼트 활성화
5. progress bar 애니메이션(transition-colors) 정상 동작 확인

### 7.4. 비밀번호 변경 페이지 UI 시각 검증

**Status:** pending  
**Dependencies:** 7.1  

비밀번호 변경 페이지(/password-change)에서 새 비밀번호 입력 시 변경된 라벨이 올바르게 표시되는지 확인한다.

**Details:**

개발 서버(pnpm dev)를 실행하고 /password-change 페이지에 접속하여 다음 시나리오를 수동 테스트:
1. 새 비밀번호 필드 비어있을 때: '비밀번호를 입력하세요' 표시
2. 약한/보통/강한 비밀번호 입력 시 각각 '약함'/'보통'/'강함' 라벨 표시
3. 색상 토큰 및 progress bar 동작 회원가입 페이지와 동일하게 동작 확인

(인증이 필요한 페이지이므로 로그인 후 테스트 또는 인증 우회 개발 모드 사용)

### 7.5. 린트 및 타입체크 통과 검증

**Status:** pending  
**Dependencies:** 7.1, 7.2  

모든 변경 사항이 프로젝트의 린트 및 타입체크 규칙을 통과하는지 최종 검증한다.

**Details:**

다음 명령을 순차적으로 실행하여 코드 품질 검증:
1. `pnpm typecheck` - TypeScript strict 모드 통과 확인
2. `pnpm lint` - ESLint 규칙 통과 확인
3. `pnpm format` - Prettier 포맷팅 적용
4. `pnpm test src/components/ui/password-strength.test.tsx` - 유닛 테스트 통과 최종 확인

모든 명령이 오류 없이 완료되어야 태스크 완료로 간주한다.
