'use client';

import { GripHorizontal, MessageSquare, Minimize2, Send } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { createChatMessage } from '@/domain/track-selection/api/createChatMessage';
import { useChatMessages } from '@/domain/track-selection/hooks/useChatMessages';
import { resolveMemberId } from '@/domain/track-selection/utils/resolveMemberId';
import { useMe } from '@/domain/member/hooks/useMe';
import { formatKst } from '@/lib/date';
import { cn } from '@/lib/cn';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/global/config/queryKeys';

import { useSetlistStore } from '../store/setlistStore';
import { MemberAvatar } from './MemberAvatar';

export interface MeetingChatBoxProps {
  selectionId: string;
  songId: string;
}

const DEFAULT_HEIGHT = 280;
const MIN_HEIGHT = DEFAULT_HEIGHT;

export function MeetingChatBox({ selectionId, songId }: MeetingChatBoxProps) {
  const songs = useSetlistStore((s) => s.songs);
  const song = useMemo(() => songs.find((x) => x.id === songId), [songs, songId]);
  const { data: me } = useMe();

  const { data: chatData } = useChatMessages(selectionId, songId);
  const messages = chatData?.content ?? [];
  const qc = useQueryClient();

  const listRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragRef = useRef<{ y: number; h: number } | null>(null);

  const onDragStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = { y: e.clientY, h: height };
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [height],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const start = dragRef.current;
      if (!start) return;
      const delta = start.y - e.clientY;
      const max = Math.max(MIN_HEIGHT, window.innerHeight - 200);
      const next = Math.min(Math.max(start.h + delta, MIN_HEIGHT), max);
      setHeight(next);
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const isExpanded = height !== DEFAULT_HEIGHT;
  const resetHeight = () => setHeight(DEFAULT_HEIGHT);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (!song) return null;

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await createChatMessage(selectionId, songId, { message: text });
      setDraft('');
      await qc.invalidateQueries({ queryKey: queryKeys.trackSelection.chat(selectionId, songId) });
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <section
      data-slot="meeting-chat-box"
      className="bg-surface border-border relative flex shrink-0 flex-col border-t"
      style={{ height }}
      aria-label={`${song.title} 의견 채팅`}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="채팅 영역 크기 조절"
        onPointerDown={onDragStart}
        className="hover:bg-accent/40 absolute -top-1 right-0 left-0 z-10 flex h-2 cursor-row-resize items-center justify-center"
      >
        <GripHorizontal className="text-foreground-muted h-3 w-3" />
      </div>

      <header className="border-border px-s-5 py-s-2 gap-s-2 flex items-center border-b">
        <MessageSquare className="text-foreground-muted h-4 w-4" />
        <span className="text-caption font-bold">{song.title}</span>
        <span className="text-foreground-muted text-micro">의견 {messages.length}개</span>
        {isExpanded && (
          <button
            type="button"
            onClick={resetHeight}
            aria-label="채팅 크기 원래대로"
            className="text-foreground-muted hover:text-foreground ml-auto rounded-md p-1"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <div ref={listRef} className="px-s-5 py-s-3 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-foreground-muted py-s-6 text-caption text-center">
            첫 의견을 남겨주세요.
          </div>
        ) : (
          <ul className="gap-s-3 flex flex-col">
            {messages.map((msg, idx) => {
              const senderId = resolveMemberId(msg);
              const mine = me?.id !== undefined && me.id === senderId;
              const displayName = mine ? '나' : (msg.member?.name ?? `멤버 #${senderId}`);
              const avatarMember = msg.member
                ? {
                    id: String(senderId),
                    name: displayName,
                    role: '',
                    avatar: 'var(--color-accent)',
                    profileImg: msg.member.profileImg,
                  }
                : undefined;
              const timeLabel = msg.createdAt
                ? formatKst(new Date(msg.createdAt), 'MM-dd HH:mm')
                : '';
              return (
                <li
                  key={msg.messageId ?? idx}
                  className={cn('gap-s-2 flex items-start', mine && 'flex-row-reverse')}
                >
                  <MemberAvatar member={avatarMember} size="sm" />
                  <div className={cn('max-w-[70%]', mine && 'text-right')}>
                    <div
                      className={cn(
                        'gap-s-2 text-micro flex items-center',
                        mine && 'flex-row-reverse',
                      )}
                    >
                      <span className="text-foreground-sub font-semibold">
                        {displayName}
                        {mine && <span className="text-accent ml-s-1">나</span>}
                      </span>
                      <span className="text-foreground-muted">{timeLabel}</span>
                    </div>
                    <div
                      className={cn(
                        'text-caption mt-s-1 px-s-3 py-s-2 inline-block rounded-lg text-left whitespace-pre-wrap',
                        mine
                          ? 'bg-accent-dim text-foreground'
                          : 'bg-card text-foreground border-border border',
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-border px-s-4 py-s-3 gap-s-2 flex items-end border-t">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder="의견을 남겨보세요. Enter 전송, Shift+Enter 줄바꿈."
          className="bg-card border-border text-caption placeholder:text-foreground-muted px-s-3 py-s-2 max-h-24 min-h-[36px] flex-1 resize-none rounded-md border outline-none"
          aria-label="채팅 입력"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!draft.trim() || sending}
          className="bg-accent text-foreground gap-s-1 px-s-3 py-s-2 text-caption inline-flex shrink-0 items-center rounded-md font-semibold disabled:opacity-40"
          aria-label="메시지 전송"
        >
          <Send className="h-3.5 w-3.5" />
          전송
        </button>
      </div>
    </section>
  );
}
