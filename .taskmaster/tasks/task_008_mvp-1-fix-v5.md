# Task ID: 8

**Title:** 회의 만들기 / 곡 추가 모달 + 매니저 권한 처리

**Status:** pending

**Dependencies:** 6

**Priority:** medium

**Description:** AddSongModal과 MeetingCreateModal을 구현하고, 매니저 권한에 따른 액션 제어를 적용한다.

**Details:**

## 파일
```
src/domain/setlist-meeting/components/AddSongModal.client.tsx
src/domain/setlist-meeting/components/MeetingCreateModal.client.tsx
```

## AddSongModal.client.tsx
- ResponsiveSheet 기반
- 폼 필드:
  - 곡명 * (required)
  - 아티스트 * (required)
  - 앨범 (optional)
  - 추천자 의견 (textarea)
- 커스텀 세션 추가 영역:
  - input + '추가' 버튼
  - 추가된 세션 칩 리스트 (X 버튼으로 삭제)
- 확인 → store.addSong 호출
- DirtyFormGuard 적용 (dirty 시 이탈 경고)

## MeetingCreateModal.client.tsx
- ResponsiveSheet 기반
- 폼 필드:
  - 회의 제목 *
  - 연결 밴드 (BandPickerModal 재사용, single 모드)
- 매니저: 현재 사용자 자동 설정
- BE 미지원 → 확인 시 toast.info("FE-API-024 후 활성화")

## 매니저 권한 처리
- meeting.managerId === currentUserId → isManager
- 세션 확정/해제: isManager만 가능
- 비매니저: 지원/취소만 가능
- UI에서 버튼 비활성화 또는 hidden 처리

**Test Strategy:**

1. '곡 추가' 버튼 클릭 → 모달 열림
2. 필수 필드 미입력 시 확인 버튼 비활성화
3. 커스텀 세션 추가/삭제 동작
4. 확인 → store.addSong → 곡 표에 새 행 추가
5. 비매니저 계정에서 확정/해제 버튼 미표시 또는 비활성화

## Subtasks

### 8.1. AddSongModal 폼 스키마 및 기본 구조 구현

**Status:** pending  
**Dependencies:** None  

곡 추가 모달의 zod 스키마 정의 및 ResponsiveSheet 기반의 폼 레이아웃을 구현한다.

**Details:**

## 파일 생성
- `src/domain/setlist-meeting/types/schema.ts` — addSongSchema 정의
- `src/domain/setlist-meeting/components/AddSongModal.client.tsx` — 모달 컴포넌트

## addSongSchema 정의
```ts
import { z } from 'zod';
export const addSongSchema = z.object({
  title: z.string().min(1, '곡명을 입력해 주세요.').max(100, '곡명은 100자 이하로 입력해 주세요.'),
  artist: z.string().min(1, '아티스트를 입력해 주세요.').max(100),
  album: z.string().max(100).optional().or(z.literal('').transform(() => undefined)),
  recommenderComment: z.string().max(500).optional().or(z.literal('').transform(() => undefined)),
});
export type AddSongSchema = z.infer<typeof addSongSchema>;
```

## AddSongModal.client.tsx 구조
- ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetBody, ResponsiveSheetFooter 사용 (BandCreateModal.client.tsx 패턴 참고)
- useForm<AddSongSchema> + zodResolver 적용
- 폼 필드: 곡명(Input, required), 아티스트(Input, required), 앨범(Input, optional), 추천자 의견(Textarea, optional)
- Props: open, onOpenChange, meetingId(또는 store에서 selectedMeetingId 사용)
- data-slot="add-song-modal" 속성 부여

### 8.2. AddSongModal 커스텀 세션 추가 영역 + DirtyFormGuard 적용

**Status:** pending  
**Dependencies:** 8.1  

곡 추가 모달에 커스텀 세션 입력/칩 리스트 UI와 DirtyFormGuard를 적용한다.

**Details:**

## 커스텀 세션 추가 영역 구현
- 별도 상태로 관리: `const [customSessions, setCustomSessions] = useState<string[]>([])`
- Input + '추가' Button 조합
- 추가 버튼 클릭 또는 Enter 시 customSessions 배열에 추가 (중복/빈값 방지)
- 추가된 세션은 Chip 컴포넌트로 렌더링 (X 버튼으로 삭제)
- Chip에 onClick 핸들러로 해당 세션 제거

## DirtyFormGuard 적용
- useRegisterDirtyForm 훅 사용 (src/global/navigation/dirty-form-context.tsx 참고)
- scope: 'add-song-modal'
- dirty 조건: formState.isDirty || customSessions.length > 0
- 모달 닫기 전 dirty 상태면 이탈 경고 (beforeunload 포함)

## 확인 버튼 동작
- form.handleSubmit으로 유효성 검사 후 store.addSong 호출 준비 (store 연동은 Task 2 의존)
- customSessions 배열도 함께 전달
- 성공 시 form.reset(), setCustomSessions([]), onOpenChange(false)

### 8.3. MeetingCreateModal 구현 및 BandPickerModal 연동

**Status:** pending  
**Dependencies:** None  

회의 만들기 모달을 ResponsiveSheet 기반으로 구현하고 BandPickerModal을 single 모드로 재사용한다.

**Details:**

## 파일 생성
- `src/domain/setlist-meeting/components/MeetingCreateModal.client.tsx`

## createMeetingSchema 정의 (types/schema.ts에 추가)
```ts
export const createMeetingSchema = z.object({
  title: z.string().min(1, '회의 제목을 입력해 주세요.').max(100),
  bandId: z.string().min(1, '연결 밴드를 선택해 주세요.'),
});
export type CreateMeetingSchema = z.infer<typeof createMeetingSchema>;
```

## MeetingCreateModal.client.tsx 구조
- Props: open, onOpenChange, trigger?(선택)
- ResponsiveSheet 기반 (BandCreateModal.client.tsx 패턴 참고)
- 폼 필드: 회의 제목(Input, required)
- 연결 밴드: Button 클릭 시 BandPickerModal 열기 (single 모드, multiple=false)
- BandPickerModal onConfirm에서 선택된 밴드 표시 (선택된 밴드명 + 변경 버튼)
- form.setValue('bandId', selectedBand.bandId) 연동
- 매니저: '현재 로그인 사용자로 자동 설정됩니다' 안내 텍스트 (별도 입력 없음)
- 확인 버튼: BE 미지원이므로 toast.info('FE-API-024 후 활성화') 호출 후 모달 닫기
- data-slot="meeting-create-modal" 속성 부여

### 8.4. 매니저 권한 처리 훅 및 UI 가드 로직 구현

**Status:** pending  
**Dependencies:** 8.1, 8.2, 8.3  

isManager 판정 훅을 구현하고 세션 확정/해제 버튼의 권한 기반 비활성화/숨김 처리를 적용한다.

**Details:**

## 권한 판정 유틸/훅 생성
- `src/domain/setlist-meeting/hooks/useIsManager.ts`
```ts
import { useAuthStore } from '@/global/store/authStore';
import { useSetlistStore } from '../store/setlistStore';

export function useIsManager(meetingId?: string) {
  // 참고: authStore에는 accessToken만 있음. 현재 사용자 ID는 별도 member/me API 또는 토큰 디코딩 필요
  // v5에서는 mock으로 현재 사용자 ID를 store에 하드코딩하거나 seed 데이터 기준으로 판정
  const meeting = useSetlistStore(s => s.meetings.find(m => m.id === meetingId));
  const currentUserId = 'mock-user-id'; // TODO: 실제 사용자 ID 연동 시 교체
  return meeting?.managerId === currentUserId;
}
```

## 권한 기반 UI 처리
- SessionPanel.client.tsx (Task 6에서 구현)에서 useIsManager 훅 사용
- isManager=true: 확정/해제 버튼 활성화 (Button disabled={false})
- isManager=false: 확정/해제 버튼 hidden 또는 disabled={true} + 툴팁 '매니저만 가능합니다'
- 비매니저는 지원/취소 버튼만 표시
- Button variant 또는 className으로 시각적 구분

## 권한 가드 컴포넌트 (선택적)
```tsx
export function ManagerOnly({ meetingId, children, fallback }: { meetingId: string; children: ReactNode; fallback?: ReactNode }) {
  const isManager = useIsManager(meetingId);
  return isManager ? <>{children}</> : (fallback ?? null);
}
```

## 적용 대상
- SessionPanel의 [확정]/[해제] 버튼
- 곡 삭제 버튼(매니저만 가능)
- 회의 설정/삭제 액션(매니저만)
