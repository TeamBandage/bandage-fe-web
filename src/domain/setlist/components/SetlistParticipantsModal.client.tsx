'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, X } from 'lucide-react';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { useSetlistParticipants } from '../hooks/useSetlistParticipants';
import { useTransferSetlistManager } from '../hooks/useTransferSetlistManager';
import type { SetlistParticipantResponse, SetlistParticipantSessionResponse } from '../types/res';

export interface SetlistParticipantsModalProps {
  setlistId: string;
  /** setlistTrackId → 트랙 제목. 세션 태그에 어느 트랙의 세션인지 함께 표시하기 위함. */
  trackTitleById: Map<string, string>;
  /** 현재 로그인한 회원이 이 셋리스트의 매니저인지 — 매니저일 때만 다른 참여자 행에 위임 메뉴 노출. */
  isManager?: boolean;
  /** 현재 로그인한 회원 ID — 본인 행에는 위임 메뉴를 띄우지 않기 위함. */
  currentMemberId?: number;
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

function ParticipantRow({
  setlistId,
  participant,
  name,
  trackGroups,
  canTransferManager,
}: {
  setlistId: string;
  participant: SetlistParticipantResponse;
  name: string;
  trackGroups: ReturnType<typeof groupSessionsByTrack>;
  canTransferManager: boolean;
}) {
  const toast = useToast();
  const [delegateOpen, setDelegateOpen] = useState(false);
  const memberId = participant.member?.memberId;

  const transferMutation = useTransferSetlistManager(setlistId, {
    onSuccess: () => {
      toast.success('매니저 권한을 위임했습니다.');
      setDelegateOpen(false);
    },
    onError: (err) => toast.error(err.message || '매니저 위임에 실패했습니다.'),
  });

  return (
    <li className="bg-card border-border gap-s-3 px-s-3 py-s-2 flex items-center rounded-md border">
      <Avatar src={participant.member?.profileImg ?? undefined} fallback={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="gap-s-2 flex items-center">
          <span className="text-caption font-semibold">{name}</span>
          {participant.isManager && (
            <span className="text-micro rounded-full bg-white/10 px-2 py-0.5 font-bold text-white">
              매니저
            </span>
          )}
        </div>
        {trackGroups.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {trackGroups.map((g) => (
              <div key={g.trackId} className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                <span className="text-foreground-muted text-xs">{g.title} -</span>
                {g.sessions.map((s) => (
                  <span
                    key={s.sessionId}
                    className="bg-surface border-border shrink-0 rounded px-1.5 py-0.5 text-xs"
                  >
                    {s.short}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {canTransferManager && memberId !== undefined && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`${name} 옵션`}
              className="text-foreground-muted hover:text-foreground rounded-sm p-1 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className={cn(
                'bg-card border-border z-50 min-w-27.5 rounded-lg border py-1 shadow-lg',
                'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
              )}
            >
              <DropdownMenu.Item
                className="text-foreground hover:bg-surface-hi cursor-pointer px-4 py-2.5 text-sm outline-none"
                onSelect={() => setDelegateOpen(true)}
              >
                매니저 위임
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      {/* 매니저 위임 다이얼로그 */}
      <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>매니저 권한 위임</DialogTitle>
            <DialogDescription>
              해당 참여자에게 매니저 권한을 넘깁니다. 위임 후 본인은 일반 참여자로 전환됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              <span className="text-nav-active font-bold">{name}</span> 에게 매니저를
              위임하시겠어요? 이 동작은 되돌릴 수 없습니다.
            </p>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button variant="ghost" className="h-8" onClick={() => setDelegateOpen(false)}>
              취소
            </Button>
            <Button
              variant="secondary"
              className="h-8 rounded-[5px] border-white bg-white px-2 text-neutral-900 hover:border-neutral-100 hover:bg-neutral-100"
              loading={transferMutation.isPending}
              onClick={() => memberId !== undefined && transferMutation.mutate(memberId)}
            >
              위임하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

export function SetlistParticipantsModal({
  setlistId,
  trackTitleById,
  isManager = false,
  currentMemberId,
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
                const isSelf =
                  currentMemberId !== undefined && p.member?.memberId === currentMemberId;
                return (
                  <ParticipantRow
                    key={p.member?.memberId ?? idx}
                    setlistId={setlistId}
                    participant={p}
                    name={name}
                    trackGroups={trackGroups}
                    canTransferManager={isManager && !isSelf}
                  />
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
