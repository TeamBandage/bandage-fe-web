# Task ID: 4

**Title:** 밴드 설정 모달 구현 (정보 수정/사진/삭제)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 밴드 LEADER 권한 사용자가 밴드 정보 수정, 프로필 사진 변경, 밴드 삭제를 수행할 수 있는 설정 모달을 구현한다.

**Details:**

## 구현 대상

1. **BandSettingsModal** (`src/domain/band/components/BandSettingsModal.client.tsx`)
   - `Tabs` 컴포넌트 활용 (3개 탭: 정보, 사진, 삭제)
   - Props: `bandId`, `initialData: BandInfoResponse`, `open`, `onOpenChange`

2. **정보 탭**
   - 이름(bandName), 설명(description) 편집 폼
   - `useForm` + zod 스키마 (`{ bandName: z.string().min(1), description: z.string().optional() }`)
   - 저장 버튼 → `updateBand` API 호출

3. **사진 탭**
   - 현재 프로필 이미지 미리보기
   - URL 직접 입력 폼 (백엔드 파일 업로드 미지원 대비)
   - 향후 멀티파트 업로드 지원 시 교체 예정 (API_REQUIRED.md FE-API-009)

4. **삭제 탭**
   - 경고 문구 + 밴드명 재입력 확인
   - input value === bandName 일 때만 삭제 버튼 활성화
   - `deleteBand` API 호출 후 `/bands` 로 리다이렉트

5. **API 함수 추가**
   - `src/domain/band/api/updateBand.ts`: PATCH /bands/{bandId}
   - `src/domain/band/api/deleteBand.ts`: DELETE /bands/{bandId}
   - `src/domain/band/api/uploadBandProfileImage.ts`: (스텁 — 백엔드 미지원 시 에러 throw)

6. **Hooks 추가**
   - `useUpdateBand.ts`, `useDeleteBand.ts`, `useUploadBandProfileImage.ts` (TanStack Query mutation)

7. **BandDetailContent 연동**
   - 기존 "밴드 설정" 버튼 (`toast.info` 표시)를 모달 트리거로 교체
   - `RoleGuard role="LEADER"` 조건 유지

## API_REQUIRED 등록
- PATCH /bands/{bandId} 미지원 시: FE-API-022
- DELETE /bands/{bandId} 미지원 시: FE-API-023

## 의사 코드
```tsx
export function BandSettingsModal({ bandId, initialData, open, onOpenChange }) {
  const [tab, setTab] = useState<'info'|'photo'|'delete'>('info');
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="info">정보</TabsTrigger>...</TabsList>
        <TabsContent value="info"><InfoForm bandId={bandId} initial={initialData} /></TabsContent>
        <TabsContent value="photo"><PhotoForm bandId={bandId} currentImg={initialData.profileImg} /></TabsContent>
        <TabsContent value="delete"><DeleteForm bandId={bandId} bandName={initialData.bandName} /></TabsContent>
      </Tabs>
    </ResponsiveSheet>
  );
}
```

**Test Strategy:**

1. LEADER 역할로 밴드 상세 진입 → "밴드 설정" 버튼 노출 + 클릭 시 모달 오픈
2. 일반 MEMBER 역할 → 버튼 미노출
3. 정보 탭: 밴드명 수정 후 저장 → API 호출 + 성공 토스트 + 상세 갱신
4. 사진 탭: URL 입력 → 미리보기 반영 (실서버 검증 필요)
5. 삭제 탭: 밴드명 틀리게 입력 → 삭제 버튼 비활성, 정확히 입력 → 활성
6. 삭제 성공 시 /bands 리다이렉트 + 목록에서 해당 밴드 제거
7. API 4xx/5xx 에러 시 토스트 표시

## Subtasks

### 4.1. 밴드 수정/삭제 API 함수 및 타입 정의

**Status:** pending  
**Dependencies:** None  

updateBand, deleteBand API 함수와 관련 타입(UpdateBandRequest 등)을 추가한다.

**Details:**

1. `src/domain/band/types/req.ts`에 `UpdateBandRequest` 인터페이스 추가 (bandName: string, description?: string, profileImg?: string)
2. `src/domain/band/api/updateBand.ts` 생성 — `PATCH /api/v1/bands/{bandId}` 호출, apiClient.patch 사용
3. `src/domain/band/api/deleteBand.ts` 생성 — `DELETE /api/v1/bands/{bandId}` 호출, apiClient.delete 사용
4. 기존 createBand.ts 패턴을 따라 에러 핸들링 구현
5. 필요 시 API_REQUIRED.md에 FE-API-022(PATCH), FE-API-023(DELETE) 등록 여부 확인

### 4.2. useUpdateBand, useDeleteBand TanStack Query 훅 구현

**Status:** pending  
**Dependencies:** 4.1  

밴드 수정/삭제를 위한 mutation 훅을 추가하고 캐시 무효화 로직을 구현한다.

**Details:**

1. `src/domain/band/hooks/useUpdateBand.ts` 생성 — useMutation 래퍼, onSuccess 시 queryKeys.band.detail(bandId) 및 queryKeys.band.all 무효화
2. `src/domain/band/hooks/useDeleteBand.ts` 생성 — useMutation 래퍼, onSuccess 시 queryKeys.band.all 무효화 (목록에서 제거 반영)
3. 기존 useLeaveBand.ts, useCreateBand.ts 패턴 참조
4. UseUpdateBandOptions, UseDeleteBandOptions 타입 정의 (onSuccess, onError 콜백)
5. types/index.ts에 새 타입 export 추가 확인

### 4.3. BandSettingsModal 컴포넌트 구현 (3개 탭 구조)

**Status:** pending  
**Dependencies:** 4.2  

ResponsiveSheet + Tabs를 활용한 밴드 설정 모달을 구현하고 정보/사진/삭제 탭별 폼을 작성한다.

**Details:**

1. `src/domain/band/components/BandSettingsModal.client.tsx` 생성
2. Props: bandId, initialData: BandInfoResponse, open, onOpenChange
3. ResponsiveSheet + Tabs 컴포넌트 조합 (variant='pill')
4. **정보 탭**: useForm + zod 스키마(bandName: z.string().min(1), description: z.string().optional()), useUpdateBand 호출, 성공 시 토스트 + onOpenChange(false)
5. **사진 탭**: 현재 이미지 미리보기 + URL 직접 입력 폼, 저장 시 updateBand의 profileImg 필드로 전달
6. **삭제 탭**: 경고 문구 표시, 밴드명 재입력 input, input === bandName일 때만 삭제 버튼 활성화, useDeleteBand 호출 후 router.replace(ROUTES.BANDS)
7. 기존 createBandSchema 참조하여 updateBandSchema 추가 또는 재사용

### 4.4. BandDetailContent에 설정 모달 연동 및 LEADER 권한 가드

**Status:** pending  
**Dependencies:** 4.3  

기존 '밴드 설정' 버튼을 BandSettingsModal 트리거로 교체하고 LEADER 역할 가드를 유지한다.

**Details:**

1. `src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx` 수정
2. BandSettingsModal import 추가
3. useState<boolean>로 settingsOpen 상태 관리
4. 기존 `onClick={() => toast.info(...)}` 대신 `onClick={() => setSettingsOpen(true)}`로 변경 (line 118)
5. BandSettingsModal 컴포넌트 렌더링: `<BandSettingsModal bandId={bandId} initialData={band} open={settingsOpen} onOpenChange={setSettingsOpen} />`
6. isLeader 조건 유지 (hasRole(myRole, 'LEADER') 체크)
7. 삭제 성공 시 /bands 리다이렉트는 모달 내부에서 처리하므로 별도 처리 불필요
