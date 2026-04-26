# Task ID: 4

**Title:** 사이드바 합주 서브 메뉴 + 합주 시작하기 라우트

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** 사이드바의 합주 항목을 expandable 서브 메뉴로 전환하고(나의 합주/합주 시작하기), `/practices/new` 라우트에 밴드 선택 → 곡 검색 → 메타데이터 입력 3단계 풀스크린 플로우를 구현한다.

**Details:**

**1. 사이드바 수정 (`src/components/layout/sidebar.tsx`):**
- 합주 항목을 expandable 처리
- 서브 메뉴: "나의 합주" (`/practices`), "합주 시작하기" (`/practices/new`)
- Chevron 아이콘으로 expand 상태 표시

**2. 라우트 상수 추가 (`src/global/config/routes.ts`):**
```ts
PRACTICES_ME: '/practices',      // 기존과 동일
PRACTICES_NEW: '/practices/new', // 합주 시작하기
```

**3. 합주 생성 페이지 재구현 (`src/app/(main)/practices/new/`):**
- 단일 패널 레이아웃 (PaneSplit 사용 안 함)
- `PracticeCreateWizard.client.tsx` (신규):
  - react-hook-form + 3단계 Zod 스키마
  - StepIndicator 컴포넌트 좌측 또는 상단 배치
  - Step 1: BandPicker 그리드 (`useMyBands`)
  - Step 2: SongSearchPanel (디바운스 → `GET /practice-songs/search`, 자작곡 토글)
  - Step 3: 제목(선택), 장소(선택), 시작 시각(DateTimePicker), 진행 시간

**4. 제출 로직:**
```ts
// 외부 곡 검색 결과 사용 시
await createPracticeSongFromSong({ practiceId: '임시', song: selectedSong });
// 자작곡 직접 입력 시
await createPracticeSong({ practiceId: '임시', ...fields });
// 최종 합주 생성
await createPractice({ song: songId, ... });
```
- 백엔드 흐름: 합주 생성 시 song 필드에 songId (UUID) 전달

**5. 곡 검색 API (`src/domain/practice-song/api/searchSongs.ts` 신규):**
- `GET /api/v1/practice-songs/search?keyword=`
- 응답: `Song[]` (title, artist, album, duration, refLink)

**Test Strategy:**

1. 사이드바에서 합주 서브 메뉴 expand/collapse 동작 확인
2. "합주 시작하기" 클릭 시 `/practices/new` 라우팅 확인
3. 3단계 플로우 각 스텝 이동 (뒤로/다음) 동작 확인
4. 밴드 선택 → 곡 검색 → 메타 입력 → 제출 → 합주 상세 라우팅 e2e 확인
5. Zod 유효성 검증 인라인 에러 표시 확인
6. `pnpm typecheck && pnpm lint` 통과

## Subtasks

### 4.1. 사이드바 합주 항목 expandable 서브 메뉴 구현

**Status:** pending  
**Dependencies:** None  

사이드바(`src/components/layout/sidebar.tsx`)의 '합주' 항목을 클릭 시 확장/축소되는 서브 메뉴로 전환하고, '나의 합주'와 '합주 시작하기' 두 개의 하위 링크를 추가한다.

**Details:**

1. `sidebar.tsx`의 `mainNav` 배열 구조를 수정하여 서브 메뉴를 지원하는 타입으로 확장
2. `NavItem` 타입에 `children?: NavItem[]` 옵션 필드 추가
3. 합주 항목의 children으로 `{ href: ROUTES.PRACTICES, label: '나의 합주' }`와 `{ href: ROUTES.PRACTICE_NEW, label: '합주 시작하기' }` 추가
4. `useState`로 expand 상태 관리 (또는 pathname 기반 자동 expand)
5. ChevronDown/ChevronRight 아이콘 import 및 expand 상태에 따른 회전 애니메이션 적용
6. 서브 메뉴 항목 렌더링 시 `pl-s-10` 등 좌측 padding 추가로 시각적 계층 표현
7. 서브 메뉴 아이템에도 `isActive` 함수 적용하여 활성 상태 스타일링 유지
8. 접근성: 서브 메뉴에 `aria-expanded`, `aria-controls` 속성 추가

### 4.2. 합주곡 검색 API 함수 및 타입 구현

**Status:** pending  
**Dependencies:** None  

`GET /api/v1/practice-songs/search` 엔드포인트를 호출하는 API 함수와 관련 타입을 `src/domain/practice-song/` 도메인 폴더에 추가한다.

**Details:**

1. `src/domain/practice-song/types/res.ts` 신규 생성:
   - `Song` 타입 정의: `{ title: string; artist: string; album: string; duration: number; refLink: string | null }`
   - `PracticeSongResponse` 타입 정의: `{ songId: string; title: string; artist: string; album: string; duration: number; refLink: string | null }`
2. `src/domain/practice-song/types/req.ts` 신규 생성:
   - `SearchSongsRequest`: `{ keyword: string }`
   - `CreatePracticeSongRequest`: `{ practiceId: string; title: string; artist: string; album: string; duration: number; refLink?: string }`
   - `CreatePracticeSongFromSongRequest`: `{ practiceId: string; song: Song }`
3. `src/domain/practice-song/types/index.ts` 신규 생성하여 타입 re-export
4. `src/domain/practice-song/api/searchSongs.ts` 신규 생성:
   - `searchSongs(keyword: string): Promise<Song[]>` 함수
   - `GET /api/v1/practice-songs/search?keyword=` 호출
5. `src/domain/practice-song/api/createPracticeSong.ts` 신규 생성:
   - 자작곡 생성용 `POST /api/v1/practice-songs` 호출
6. `src/domain/practice-song/api/createPracticeSongFromSong.ts` 신규 생성:
   - 외부 검색 결과 사용 `POST /api/v1/practice-songs/from-song` 호출

### 4.3. 합주 생성 마법사 3단계 Zod 스키마 및 타입 정의

**Status:** pending  
**Dependencies:** 4.2  

3단계 위저드(밴드 선택 → 곡 검색 → 메타데이터 입력) 각 단계별 유효성 검증을 위한 Zod 스키마를 정의한다.

**Details:**

1. `src/domain/practice/types/schema.ts`에 위저드용 스키마 추가:
   - `step1Schema`: `bandId: z.string().uuid('밴드를 선택해 주세요.')`
   - `step2Schema`: `song: z.object({ title, artist, album, duration, refLink })` 또는 자작곡용 필드
   - `step3Schema`: 기존 `startAt`, `durationMinutes` + optional `title`, `venue`
2. 전체 위저드 데이터 타입 정의:
   ```ts
   export const practiceWizardSchema = z.object({
     bandId: z.string().uuid(),
     songType: z.enum(['search', 'custom']),
     song: Song (search 선택 시) | null,
     customSong: { title, artist, album, duration, refLink } (custom 선택 시),
     title: z.string().max(100).optional(),
     venue: z.string().max(200).optional(),
     startAt: z.string().regex(KST_DATETIME),
     durationMinutes: z.number().int().min(15).max(480)
   });
   ```
3. `PracticeWizardSchema` 타입 export
4. 각 스텝별 partial 스키마로 `trigger` 시 부분 검증 가능하도록 구성

### 4.4. PracticeCreateWizard.client.tsx 3단계 위저드 UI 구현

**Status:** pending  
**Dependencies:** 4.1, 4.2, 4.3  

`src/app/(main)/practices/new/` 경로에 단일 패널 레이아웃의 3단계 풀스크린 위저드 컴포넌트를 구현한다.

**Details:**

1. 기존 `PracticeCreateForm.client.tsx` 파일을 `PracticeCreateWizard.client.tsx`로 리네임 또는 교체
2. 컴포넌트 구조:
   - `useState<0|1|2>`로 현재 스텝 관리
   - `react-hook-form` + `zodResolver`로 전체 폼 상태 관리
   - 상단에 `StepIndicator` 컴포넌트 배치 (`steps=['밴드 선택', '곡 선택', '일정 설정']`)
3. Step 1 - 밴드 선택:
   - `useMyBands` 훅으로 내 밴드 목록 조회
   - 밴드 카드 그리드 렌더링 (클릭 시 선택 상태 토글)
   - 선택된 밴드 시각적 하이라이트 (`ring-accent` border)
4. Step 2 - 곡 검색/선택:
   - 검색 Input + 디바운스(300ms) 적용
   - `searchSongs` API 호출 결과 리스트 렌더링
   - '자작곡 직접 입력' 토글 스위치 → 토글 시 수동 입력 폼 노출
   - 곡 선택 시 폼 값 설정
5. Step 3 - 메타데이터 입력:
   - 제목(선택), 장소(선택), 시작 시각(`DateTimePicker`), 진행 시간 Input
6. 하단 네비게이션: 이전/다음/만들기 버튼
7. `page.tsx` 수정하여 `PracticeCreateWizard` import

### 4.5. 합주 생성 제출 로직 및 라우팅 연동 완성

**Status:** pending  
**Dependencies:** 4.4  

위저드 마지막 단계에서 합주곡 생성 → 합주 생성 순서로 API를 호출하고, 성공 시 합주 상세 페이지로 라우팅한다.

**Details:**

1. 제출 핸들러 구현 순서:
   a) 외부 곡 선택 시: `createPracticeSongFromSong({ practiceId: 임시값, song })` 호출 → `songId` 획득
   b) 자작곡 입력 시: `createPracticeSong({ practiceId: 임시값, ...fields })` 호출 → `songId` 획득
   c) `createPractice({ song: songId, bandId, title?, venue?, startAt, durationMinutes })` 호출
   - 주의: API_SPEC 확인 결과 합주 생성 시 `song` 필드에 songId(UUID) 전달
2. 백엔드 흐름 확인: practiceId 없이 합주곡 먼저 생성 불가 시 순서 조정 필요 (합주 생성 → 합주곡 연결)
3. Mutation 로딩 상태 동안 '만들기' 버튼 `loading` prop 적용
4. 성공 시:
   - `toast.success('합주가 생성되었습니다.')`
   - `router.replace(ROUTES.PRACTICE_DETAIL(data.practiceId))`
5. 에러 시:
   - `toast.error(err.message || '합주 생성에 실패했습니다.')`
   - 폼 상태 유지
6. TanStack Query 캐시 무효화: `queryClient.invalidateQueries({ queryKey: queryKeys.practice.list() })`
