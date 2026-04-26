'use client';

import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { cn } from '@/lib/cn';

import { useSetlistStore } from '../store/setlistStore';

import { MemberAvatar } from './MemberAvatar';

export interface MeetingChatBoxProps {
  songId: string;
}

export function MeetingChatBox({ songId }: MeetingChatBoxProps) {
  // selector 내부 find 가 매 렌더마다 새 참조 → 무한 루프. 배열 select + useMemo 로 분리.
  const songs = useSetlistStore((s) => s.songs);
  const song = useMemo(() => songs.find((x) => x.id === songId), [songs, songId]);
  const members = useSetlistStore((s) => s.members);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const sendChat = useSetlistStore((s) => s.sendChat);

  const listRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');

  // 새 메시지 추가 시 자동 스크롤.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [song?.chat.length]);

  if (!song) return null;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    sendChat(song.id, currentUserId, text);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section
      data-slot="meeting-chat-box"
      className="bg-surface border-border flex h-[280px] shrink-0 flex-col border-t border-l"
      aria-label={`${song.title} 의견 채팅`}
    >
      <header className="border-border px-s-5 py-s-2 gap-s-2 flex items-center border-b">
        <MessageSquare className="text-foreground-muted h-4 w-4" />
        <span className="text-caption font-bold">{song.title}</span>
        <span className="text-foreground-muted text-micro">의견 {song.chat.length}개</span>
      </header>

      <div ref={listRef} className="px-s-5 py-s-3 flex-1 overflow-y-auto">
        {song.chat.length === 0 ? (
          <div className="text-foreground-muted py-s-6 text-caption text-center">
            첫 의견을 남겨주세요.
          </div>
        ) : (
          <ul className="gap-s-3 flex flex-col">
            {song.chat.map((msg, idx) => {
              const m = members.find((mm) => mm.id === msg.userId);
              const mine = msg.userId === currentUserId;
              return (
                <li
                  key={`${msg.userId}-${msg.at}-${idx}`}
                  className={cn('gap-s-2 flex items-start', mine && 'flex-row-reverse')}
                >
                  <MemberAvatar member={m} size="sm" />
                  <div className={cn('max-w-[70%]', mine && 'text-right')}>
                    <div
                      className={cn(
                        'gap-s-2 text-micro flex items-center',
                        mine && 'flex-row-reverse',
                      )}
                    >
                      <span className="text-foreground-sub font-semibold">
                        {m?.name ?? '?'}
                        {mine && <span className="text-accent ml-s-1">나</span>}
                      </span>
                      <span className="text-foreground-muted">{msg.at}</span>
                    </div>
                    <div
                      className={cn(
                        'text-caption mt-s-1 px-s-3 py-s-2 inline-block rounded-lg text-left whitespace-pre-wrap',
                        mine
                          ? 'bg-accent-dim text-foreground'
                          : 'bg-card text-foreground border-border border',
                      )}
                    >
                      {msg.msg}
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
          onClick={submit}
          disabled={!draft.trim()}
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
