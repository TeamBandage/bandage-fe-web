'use client';

import { X } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';

import { useSetlistParticipants } from '../hooks/useSetlistParticipants';
import type { SetlistParticipantSessionResponse } from '../types/res';

export interface SetlistParticipantsModalProps {
  setlistId: string;
  /** setlistTrackId → 트랙 제목. 세션 태그에 어느 트랙의 세션인지 함께 표시하기 위함. */
  trackTitleById: Map<string, string>;
  onClose: () => void;
}

/** 세션 목록을 트랙 단위로 묶어 "트랙 제목: 세션1 세션2" 형태로 표시할 수 있게 그룹핑. */
function groupSessionsByTrack(
  sessions: SetlistParticipantSessionResponse[],
  trackTitleById: Map<string, string>,
) {
  const order: string[] = [];
  const byTrack = new Map<
    string,
    { title: string; sessions: SetlistParticipantSessionResponse[] }
  >();
  for (const s of sessions) {
    if (!byTrack.has(s.setlistTrackId)) {
      order.push(s.setlistTrackId);
      byTrack.set(s.setlistTrackId, {
        title: trackTitleById.get(s.setlistTrackId) ?? '삭제된 트랙',
        sessions: [],
      });
    }
    byTrack.get(s.setlistTrackId)!.sessions.push(s);
  }
  return order.map((trackId) => ({ trackId, ...byTrack.get(trackId)! }));
}

export function SetlistParticipantsModal({
  setlistId,
  trackTitleById,
  onClose,
}: SetlistParticipantsModalProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSetlistParticipants(setlistId);
  const participants = data?.pages.flatMap((p) => p.content) ?? [];
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border-border w-full max-w-md rounded-xl border shadow-xl">
        <header className="border-border px-s-5 py-s-4 flex items-center justify-between border-b">
          <h2 className="text-title font-bold">참여자 목록</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground rounded-md p-1"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-s-5 py-s-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          ) : participants.length === 0 ? (
            <p className="text-foreground-muted text-caption py-s-6 text-center">
              참여자가 없습니다.
            </p>
          ) : (
            <ul className="gap-s-2 flex flex-col">
              {participants.map((p, idx) => {
                const name = p.member?.name ?? '탈퇴한 회원';
                const trackGroups = groupSessionsByTrack(p.sessions, trackTitleById);
                return (
                  <li
                    key={p.member?.memberId ?? idx}
                    className="bg-card border-border gap-s-3 px-s-3 py-s-2 flex items-center rounded-md border"
                  >
                    <Avatar src={p.member?.profileImg ?? undefined} fallback={name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="gap-s-2 flex items-center">
                        <span className="text-caption font-semibold">{name}</span>
                        {p.isManager && (
                          <span className="text-micro rounded-full bg-white/10 px-2 py-0.5 font-bold text-white">
                            매니저
                          </span>
                        )}
                      </div>
                      {trackGroups.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {trackGroups.map((g) => (
                            <div key={g.trackId} className="flex flex-wrap items-center gap-1">
                              <span className="text-foreground-muted text-xs">{g.title}</span>
                              {g.sessions.map((s) => (
                                <span
                                  key={s.sessionId}
                                  className="bg-surface border-border rounded px-1.5 py-0.5 text-xs"
                                >
                                  {s.short}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              {hasNextPage && (
                <li aria-hidden="true">
                  <div ref={loadMoreRef} className="h-4" />
                </li>
              )}
              {isFetchingNextPage && (
                <li className="px-s-3 py-s-2">
                  <Skeleton className="h-8 w-full" rounded="md" />
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
