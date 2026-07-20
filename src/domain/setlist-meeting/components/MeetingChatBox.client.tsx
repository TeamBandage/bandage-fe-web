'use client';

import { MessageSquare, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

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
  /** 우측 패널(세션 지원 + 채팅) 전체 닫기. */
  onClose?: () => void;
}

export function MeetingChatBox({ selectionId, songId, onClose }: MeetingChatBoxProps) {
  const songs = useSetlistStore((s) => s.songs);
  const song = useMemo(() => songs.find((x) => x.id === songId), [songs, songId]);
  const { data: me } = useMe();

  const { data: chatData } = useChatMessages(selectionId, songId);
  // 서버는 최신순으로 내려주므로 과거 → 최신 순으로 뒤집어서 표시.
  const messages = useMemo(() => {
    const raw = chatData?.content ?? [];
    return [...raw].sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [chatData]);
  // 날짜가 바뀔 때만 가운데 날짜 구분선을 보여주기 위해 메시지별로 날짜 변경 여부를 미리 계산.
  const messagesWithDate = useMemo(() => {
    let lastDateKey: string | null = null;
    return messages.map((msg) => {
      const dateKey = msg.createdAt ? formatKst(new Date(msg.createdAt), 'yyyy-MM-dd') : null;
      const showDateDivider = dateKey !== null && dateKey !== lastDateKey;
      if (dateKey !== null) lastDateKey = dateKey;
      return { msg, dateKey, showDateDivider };
    });
  }, [messages]);
  const qc = useQueryClient();

  const listRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

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
      className="bg-surface border-border flex h-full w-full flex-1 flex-col border-l"
      aria-label={`${song.title} 의견 채팅`}
    >
      <header className="border-border px-s-5 py-s-2 gap-s-2 flex items-center border-b">
        <MessageSquare className="text-foreground-muted h-4 w-4" />
        <span className="text-caption font-bold">{song.title}</span>
        <span className="text-foreground-muted text-micro">의견 {messages.length}개</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground ml-auto rounded-md p-1"
            aria-label="패널 닫기"
          >
            <X className="h-4 w-4" />
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
            {messagesWithDate.map(({ msg, dateKey, showDateDivider }, idx) => {
              const senderId = resolveMemberId(msg);
              const mine = me?.id !== undefined && me.id === senderId;
              const displayName = msg.member?.name ?? `멤버 #${senderId}`;
              const avatarMember = msg.member
                ? {
                    id: String(senderId),
                    name: displayName,
                    role: '',
                    avatar: 'var(--color-border-hi)',
                    profileImg: msg.member.profileImg,
                  }
                : undefined;
              const timeLabel = msg.createdAt ? formatKst(new Date(msg.createdAt), 'HH:mm') : '';
              const dateLabel = dateKey
                ? formatKst(new Date(msg.createdAt!), 'yyyy년 M월 d일')
                : '';
              return (
                <li key={msg.messageId ?? idx} className="contents">
                  {showDateDivider && (
                    <div className="text-foreground-muted text-micro py-s-1 flex items-center justify-center">
                      {dateLabel}
                    </div>
                  )}
                  <div className={cn('gap-s-2 flex items-start', mine && 'flex-row-reverse')}>
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
                          {mine && <span className="ml-s-1 text-white">나</span>}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'gap-s-1 mt-s-1 flex items-end',
                          mine ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        <div
                          className={cn(
                            'text-caption px-s-3 py-s-2 inline-block rounded-[7px] text-left whitespace-pre-wrap',
                            mine
                              ? 'text-foreground bg-white/10'
                              : 'bg-card text-foreground border-border border',
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-foreground-muted text-micro shrink-0">
                          {timeLabel}
                        </span>
                      </div>
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
          maxLength={500}
          placeholder="의견을 남겨보세요. Enter 전송, Shift+Enter 줄바꿈."
          className="bg-card border-border text-caption placeholder:text-foreground-muted px-s-3 py-s-2 max-h-24 min-h-[36px] flex-1 resize-none rounded-[5px] border outline-none"
          aria-label="채팅 입력"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!draft.trim() || sending}
          className="gap-s-1 px-s-3 py-s-2 text-caption inline-flex shrink-0 items-center rounded-md bg-white font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-40"
          aria-label="메시지 전송"
        >
          <Send className="h-3.5 w-3.5" />
          전송
        </button>
      </div>
    </section>
  );
}
