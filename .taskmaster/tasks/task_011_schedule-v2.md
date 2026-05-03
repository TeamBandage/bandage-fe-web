# Task ID: 11

**Title:** Export(jpeg) 기능 구현

**Status:** pending

**Dependencies:** 5

**Priority:** medium

**Description:** 시간표 캡처 및 이미지 다운로드. html2canvas 또는 dom-to-image-more 라이브러리 도입. 캡처 영역 지정 + 다운로드 트리거.

**Details:**

1. dom-to-image-more 패키지 설치 (html2canvas 대비 폰트 렌더링 우수)
   ```bash
   pnpm add dom-to-image-more
   ```
2. useScheduleExport.ts 훅 생성
   ```ts
   import domtoimage from 'dom-to-image-more';
   
   export function useScheduleExport(ref: RefObject<HTMLElement>) {
     const exportJpeg = async (filename: string) => {
       if (!ref.current) return;
       const dataUrl = await domtoimage.toJpeg(ref.current, { quality: 0.95 });
       const link = document.createElement('a');
       link.download = `${filename}.jpg`;
       link.href = dataUrl;
       link.click();
     };
     return { exportJpeg };
   }
   ```
3. ScheduleBoardEditor에 ref 연결 (캡처 대상 영역)
4. 상단 메뉴(...)에 'Export (JPEG)' 옵션 추가
5. 캡처 시 로딩 스피너 표시
6. 파일명: `{회의명}_{시간표명}_{날짜}.jpg`

**Test Strategy:**

1. Export 버튼 클릭 시 이미지 다운로드
2. 다운로드된 이미지에 시간표 내용 포함
3. 폰트/색상 정상 렌더링
4. 로딩 상태 표시
5. 파일명 형식 확인

## Subtasks

### 11.1. dom-to-image-more 패키지 설치 및 타입 정의

**Status:** pending  
**Dependencies:** None  

dom-to-image-more 라이브러리를 프로젝트에 설치하고, TypeScript 타입 선언 파일을 추가하여 타입 안전성을 확보합니다.

**Details:**

1. pnpm add dom-to-image-more 명령으로 패키지 설치
2. @types/dom-to-image-more가 없으면 src/types/dom-to-image-more.d.ts 생성
3. 타입 선언: declare module 'dom-to-image-more' { function toJpeg(node: HTMLElement, options?: { quality?: number; bgcolor?: string; ... }): Promise<string>; export default { toJpeg, toPng, toBlob, toPixelData, toSvg }; }
4. tsconfig.json의 include 배열에 src/types 경로가 포함되어 있는지 확인
5. 패키지 설치 후 pnpm typecheck로 타입 오류 없음 검증

### 11.2. useScheduleExport 훅 구현

**Status:** pending  
**Dependencies:** 11.1  

dom-to-image-more를 활용하여 HTMLElement를 JPEG로 변환하고 다운로드하는 커스텀 훅을 생성합니다. 로딩 상태와 에러 처리를 포함합니다.

**Details:**

1. src/domain/schedule-coordination/hooks/useScheduleExport.ts 파일 생성
2. 훅 시그니처: export function useScheduleExport(ref: RefObject<HTMLElement | null>)
3. 상태: isExporting (boolean) - 캡처 진행 중 표시용
4. exportJpeg 함수: async (filename: string) => Promise<void>
   - ref.current가 null이면 early return
   - isExporting = true 설정
   - try: domtoimage.toJpeg(ref.current, { quality: 0.95, bgcolor: '#1a1a1a' }) 호출
   - dataUrl을 anchor 태그로 다운로드 트리거 (link.download = filename.jpg, link.href = dataUrl, link.click())
   - catch: toast.error('이미지 생성 실패')
   - finally: isExporting = false
5. 반환: { exportJpeg, isExporting }

### 11.3. SchedulingMain 컴포넌트에 캡처 대상 ref 연결 및 DropdownMenu 추가

**Status:** pending  
**Dependencies:** 11.2  

SchedulingMain.client.tsx에 캡처 대상 영역의 ref를 연결하고, 상단 헤더에 DropdownMenu를 추가하여 Export (JPEG) 옵션을 제공합니다.

**Details:**

1. SchedulingMain.client.tsx 상단에 useRef<HTMLDivElement>(null) 추가
2. 캡처 대상 영역(메인 컨텐츠 래퍼 div)에 ref 연결
3. @radix-ui/react-dropdown-menu 활용하여 헤더에 MoreHorizontal 아이콘 버튼 + DropdownMenu 추가
4. DropdownMenu 메뉴 항목: 'Export (JPEG)' - Download 아이콘 + 텍스트
5. useScheduleExport 훅 호출: const { exportJpeg, isExporting } = useScheduleExport(captureRef)
6. 메뉴 클릭 시 exportJpeg(`${meeting.title}_${meeting.bandName}_${new Date().toISOString().slice(0,10)}`) 호출
7. isExporting=true 상태일 때 버튼에 Spinner 표시 또는 disabled 처리
8. 파일명 생성 로직: formatKst 활용하여 'yyyy-MM-dd' 형식 날짜 포함

### 11.4. Export 기능 E2E 검증 및 스타일 보정

**Status:** pending  
**Dependencies:** 11.3  

실제 브라우저 환경에서 Export 기능을 검증하고, 캡처된 이미지의 스타일(폰트, 색상, 레이아웃)이 정상적으로 렌더링되는지 확인합니다.

**Details:**

1. 로컬 개발 서버에서 실제 Export 기능 테스트
2. 캡처 영역 스타일 보정이 필요한 경우 처리:
   - dom-to-image-more 옵션에 bgcolor 지정 (다크 테마 배경색)
   - 필요 시 style 옵션으로 추가 CSS 인라인 적용
3. 다운로드된 JPEG 이미지 품질 확인:
   - 폰트 렌더링 정상 여부
   - 색상(accent, success, warn 등) 정상 표시
   - 레이아웃 깨짐 없음
4. 파일명 형식 검증: '{회의명}_{밴드명}_{날짜}.jpg'
5. 에러 케이스 테스트: ref가 없는 상태에서 호출, 네트워크 이슈 등
6. 필요 시 Playwright E2E 테스트 추가 - 다운로드 트리거 확인
