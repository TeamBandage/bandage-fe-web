# Task ID: 7

**Title:** 곡별 채팅 분할 패널 구현

**Status:** pending

**Dependencies:** 5

**Priority:** medium

**Description:** MeetingChatBox 컴포넌트를 구현하여 디테일 영역 하단에 곡별 채팅 기능을 제공한다.

**Details:**

## 파일
```
src/domain/setlist-meeting/components/MeetingChatBox.client.tsx
```

## MeetingDetail에 통합
- 디테일 영역 하단의 split 패널
- 고정 높이 280px (v5는 드래그 리사이즈 미지원)
- border-top으로 곡 표와 구분

## MeetingChatBox.client.tsx
```tsx
type Props = {
  messages: ChatMessage[];
  currentUserId: string;
  songTitle: string;
  onSend: (msg: string) => void;
};
```

- 헤더: 채팅 아이콘 + 곡명 + "의견 N개"
- 메시지 목록:
  - 본인 메시지: 우측 정렬 + accent-dim 버블
  - 타인 메시지: 좌측 정렬 + card 배경
  - 아바타 + 이름 + 시간
- 입력 영역:
  - input + 전송 버튼
  - Enter 전송, Shift+Enter 줄바꿈
- 전송 → store.sendChat 호출
- 자동 스크롤: 새 메시지 시 scrollTop = scrollHeight

## 모바일 처리 (v5)
- lg 미만에서는 placeholder 표시: "선곡 회의는 데스크톱에서 이용해 주세요"

**Test Strategy:**

1. 곡 선택 시 해당 곡의 채팅 메시지 표시
2. 메시지 입력 후 Enter → store.sendChat 호출 → 목록에 새 메시지 추가
3. 새 메시지 추가 시 자동 스크롤
4. 모바일 뷰포트에서 placeholder 표시

## Subtasks

### 7.1. ChatMessage 타입 정의 및 Zustand store에 채팅 액션 추가

**Status:** pending  
**Dependencies:** None  

domain/setlist-meeting/types.ts에 ChatMessage 타입을 정의하고, setlistStore에 sendChat 액션과 메시지 상태 관리 로직을 추가한다.

**Details:**

## types.ts ChatMessage 타입
```ts
export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string; // yyyy-MM-dd HH:mm
};
```

## setlistStore 채팅 관련 상태/액션
- messages: Record<songId, ChatMessage[]> 형태로 곡별 메시지 관리
- sendChat(songId: string, content: string): 현재 사용자로 새 메시지 추가
- getMessagesForSong(songId: string): ChatMessage[] 반환
- persist 미들웨어로 sessionStorage에 저장하여 새로고침 후에도 유지

### 7.2. MeetingChatBox 컴포넌트 기본 구조 및 메시지 목록 UI 구현

**Status:** pending  
**Dependencies:** 7.1  

MeetingChatBox.client.tsx 파일을 생성하고, 헤더(채팅 아이콘 + 곡명 + 의견 N개)와 메시지 목록 렌더링 UI를 구현한다.

**Details:**

## 파일 위치
src/domain/setlist-meeting/components/MeetingChatBox.client.tsx

## Props 인터페이스
```tsx
type Props = {
  messages: ChatMessage[];
  currentUserId: string;
  songTitle: string;
  onSend: (msg: string) => void;
};
```

## 컴포넌트 구조
- 컨테이너: h-[280px] 고정 높이, border-t로 상단 구분, flex flex-col
- 헤더: MessageCircle 아이콘(lucide-react) + songTitle + '의견 N개' 배지
- 메시지 목록: flex-1 overflow-y-auto, ref로 스크롤 컨테이너 참조
  - 본인 메시지: justify-end, bg-accent-dim 버블, rounded-lg
  - 타인 메시지: justify-start, bg-card 버블
  - 각 메시지: Avatar(sm) + 이름(text-micro) + 내용 + 시간(text-foreground-muted text-micro)

## 스타일 토큰
- globals.css의 기존 토큰 활용: bg-card, bg-accent-dim, text-foreground-sub, text-micro 등

### 7.3. 채팅 입력 영역 및 전송 기능 구현 (Enter/Shift+Enter 처리)

**Status:** pending  
**Dependencies:** 7.2  

MeetingChatBox에 텍스트 입력 영역과 전송 버튼을 추가하고, Enter 키 전송 및 Shift+Enter 줄바꿈 동작을 구현한다.

**Details:**

## 입력 영역 구조
- 컨테이너: border-t border-border px-s-3 py-s-2 flex items-end gap-s-2
- textarea 또는 input: 기존 Input 컴포넌트 스타일 참고, flex-1, min-h-[40px] max-h-[80px] resize-none
- 전송 버튼: Button variant='primary' size='sm', Send 아이콘(lucide-react)

## 키보드 이벤트 처리
```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
  // Shift+Enter는 기본 동작(줄바꿈) 허용
};
```

## 전송 로직
- 빈 문자열/공백만 있으면 전송 방지
- onSend(msg.trim()) 호출 후 입력 필드 초기화
- 전송 버튼도 빈 입력 시 disabled 처리

## 자동 스크롤
- useEffect로 messages 변경 감지
- scrollRef.current.scrollTop = scrollRef.current.scrollHeight로 최하단 스크롤

### 7.4. 모바일 반응형 처리 및 MeetingDetail 통합

**Status:** pending  
**Dependencies:** 7.3  

lg 미만 뷰포트에서 placeholder 메시지를 표시하고, MeetingDetail 컴포넌트에 MeetingChatBox를 split 패널로 통합한다.

**Details:**

## 모바일 반응형 처리
- useIsDesktop() 훅(src/hooks/use-media-query.ts) 활용
- lg 미만(960px 미만)일 때:
  ```tsx
  if (!isDesktop) {
    return (
      <div className="h-[280px] border-t border-border flex items-center justify-center text-foreground-muted text-body text-center px-s-4">
        선곡 회의는 데스크톱에서 이용해 주세요
      </div>
    );
  }
  ```

## MeetingDetail 통합
- MeetingDetail 컴포넌트의 하단에 MeetingChatBox 배치
- 곡 테이블과 border-t로 구분
- 선택된 곡(selectedSongId)의 메시지와 곡 제목을 props로 전달
- onSend는 store.sendChat(selectedSongId, msg) 호출

## 통합 구조
```tsx
// MeetingDetail 내부
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-auto">{/* 곡 테이블 */}</div>
  <MeetingChatBox
    messages={store.getMessagesForSong(selectedSongId)}
    currentUserId={currentUser.id}
    songTitle={selectedSong?.title ?? ''}
    onSend={(msg) => store.sendChat(selectedSongId, msg)}
  />
</div>
```
