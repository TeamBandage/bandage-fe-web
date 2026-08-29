'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Loader2, MoreVertical, Search, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { useMemberSearch } from '@/domain/member/hooks/useMemberSearch';
import { useLeaveSelection } from '@/domain/track-selection/hooks/useLeaveSelection';
import { useTransferManager } from '@/domain/track-selection/hooks/useTransferManager';
import { useUpdateParticipants } from '@/domain/track-selection/hooks/useUpdateParticipants';
import type { TrackSelectionParticipant } from '@/domain/track-selection/types/res';
import { resolveMemberId } from '@/domain/track-selection/utils/resolveMemberId';
import { ROUTES } from '@/global/config/routes';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import type { Member } from '../types';

export interface ParticipantsModalProps {
  selectionId: string;
  bandIds: string[];
  participants: TrackSelectionParticipant[];
  members: Member[];
  currentUserId: string;
  /** 매니저가 확정 전(선곡 진행 중)일 때만 false — 참여자 추가/제거 가능 여부. 매니저 위임은 이와 무관하게 항상 가능. */
  readOnly?: boolean;
  /** 매니저 위임 가능 여부 — 확정/잠김 상태와 무관하게 매니저 본인이면 항상 true. */
  isManager?: boolean;
  onClose: () => void;
}

function ParticipantRow({
  selectionId,
  memberId,
  name,
  avatarSrc,
  isSelf,
  readOnly,
  canTransferManager,
  onRemove,
  removePending,
  onClose,
}: {
  selectionId: string;
  memberId: number;
  name: string;
  avatarSrc?: string;
  isSelf: boolean;
  readOnly: boolean;
  canTransferManager: boolean;
  onRemove: (memberId: number) => void;
  removePending: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const transferMutation = useTransferManager(selectionId, {
    onSuccess: () => {
      toast.success('매니저 권한을 위임했습니다.');
      setDelegateOpen(false);
    },
    onError: (err) => toast.error(err.message || '매니저 위임에 실패했습니다.'),
  });

  const leaveMutation = useLeaveSelection(selectionId, {
    onSuccess: () => {
      toast.success('선곡 회의에서 떠났습니다.');
      onClose();
      router.replace(ROUTES.TRACK_SELECTIONS);
    },
    onError: (err) => toast.error(err.message || '떠나기에 실패했습니다.'),
  });

  return (
    <li className="bg-card border-border gap-s-3 px-s-3 py-s-2 flex items-center rounded-md border">
      <Avatar src={avatarSrc} fallback={name} size="sm" />
      <div className="min-w-0 flex-1">
        <span className="text-caption font-semibold">{name}</span>
        {isSelf && <span className="text-micro ml-s-2 font-bold text-white">나</span>}
      </div>

      {isSelf && (
        <button
          type="button"
          onClick={() => setLeaveOpen(true)}
          aria-label="선곡 회의 떠나기"
          className="text-foreground-muted hover:text-danger gap-s-1 rounded-md p-1 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}

      {!isSelf && (canTransferManager || !readOnly) && (
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
                'bg-card border-border z-50 min-w-[110px] rounded-lg border py-1 shadow-lg',
                'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
              )}
            >
              {canTransferManager && (
                <DropdownMenu.Item
                  className="text-foreground hover:bg-surface-hi cursor-pointer px-4 py-2.5 text-sm outline-none"
                  onSelect={() => setDelegateOpen(true)}
                >
                  매니저 위임
                </DropdownMenu.Item>
              )}
              {!readOnly && (
                <DropdownMenu.Item
                  className="text-danger hover:bg-surface-hi cursor-pointer px-4 py-2.5 text-sm outline-none"
                  onSelect={() => onRemove(memberId)}
                >
                  내보내기
                </DropdownMenu.Item>
              )}
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
              onClick={() => transferMutation.mutate(memberId)}
            >
              위임하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 떠나기 다이얼로그 */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>선곡 회의를 떠나시겠어요?</DialogTitle>
            <DialogDescription>
              떠난 후에는 해당 선곡 회의의 곡·채팅에 접근할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => setLeaveOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              loading={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
            >
              떠나기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isSelf && removePending && (
        <Loader2 className="text-foreground-muted h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      )}
    </li>
  );
}

export function ParticipantsModal({
  selectionId,
  bandIds,
  participants,
  members,
  currentUserId,
  readOnly = false,
  isManager = false,
  onClose,
}: ParticipantsModalProps) {
  const [memberQuery, setMemberQuery] = useState('');
  const toast = useToast();
  const updateParticipants = useUpdateParticipants(selectionId);
  const {
    data: memberSearchData,
    isFetching: searching,
    fetchNextPage: fetchNextMemberSearch,
    hasNextPage: hasNextMemberSearch,
    isFetchingNextPage: isFetchingNextMemberSearch,
  } = useMemberSearch(memberQuery, 20);
  const searchResults = memberSearchData?.pages.flatMap((p) => p.content) ?? [];
  const memberSearchLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextMemberSearch,
    isFetchingNextPage: isFetchingNextMemberSearch,
    fetchNextPage: fetchNextMemberSearch,
  });

  const participantIds = new Set(
    participants.map((p) => resolveMemberId(p)).filter((id): id is number => id !== undefined),
  );

  const handleRemove = (memberId: number) => {
    if (memberId === Number(currentUserId)) {
      toast.error('본인은 제거할 수 없습니다.');
      return;
    }
    updateParticipants.mutate(
      { add: [], remove: [memberId] },
      {
        onSuccess: () => toast.success('참여자가 제거되었습니다.'),
        onError: () => toast.error('참여자 제거에 실패했습니다.'),
      },
    );
  };

  const handleAdd = (memberId: number) => {
    updateParticipants.mutate(
      { add: [{ memberId, bandIds }], remove: [] },
      {
        onSuccess: () => toast.success('참여자가 추가되었습니다.'),
        onError: () => toast.error('참여자 추가에 실패했습니다.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border-border w-full max-w-md rounded-xl border shadow-xl">
        <header className="border-border px-s-5 py-s-4 flex items-center justify-between border-b">
          <h2 className="text-title font-bold">{readOnly ? '참여자 목록' : '참여자 관리'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground rounded-md p-1"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-s-5 py-s-4 space-y-s-4 max-h-[70vh] overflow-y-auto">
          {/* 현재 참여자 목록 */}
          <section>
            <p className="text-foreground-muted text-micro mb-s-2 font-bold uppercase">
              현재 참여자
            </p>
            <ul className="gap-s-1 flex flex-col">
              {participants.flatMap((p) => {
                const memberId = resolveMemberId(p);
                if (memberId === undefined) return [];
                const member = members.find((m) => m.id === String(memberId));
                const name = member?.name ?? p.member?.name ?? `멤버 #${memberId}`;
                const isSelf = String(memberId) === currentUserId;
                return (
                  <ParticipantRow
                    key={memberId}
                    selectionId={selectionId}
                    memberId={memberId}
                    name={name}
                    avatarSrc={member?.profileImg ?? p.member?.profileImg ?? undefined}
                    isSelf={isSelf}
                    readOnly={readOnly}
                    canTransferManager={isManager}
                    onRemove={handleRemove}
                    removePending={updateParticipants.isPending}
                    onClose={onClose}
                  />
                );
              })}
            </ul>
          </section>

          {/* 멤버 검색으로 추가 */}
          {!readOnly && (
            <section>
              <p className="text-foreground-muted text-micro mb-s-2 font-bold uppercase">
                멤버 추가
              </p>
              <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-2 flex items-center rounded-md border">
                <Search className="text-foreground-muted h-4 w-4 shrink-0" />
                <input
                  type="search"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="이름 · 이메일로 검색"
                  className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
                  aria-label="멤버 검색"
                />
                {searching && <Loader2 className="text-foreground-muted h-4 w-4 animate-spin" />}
              </div>

              {memberQuery.trim() && (
                <ul className="border-border rounded-md border">
                  {searchResults.length === 0 && !searching ? (
                    <li className="text-foreground-muted text-caption px-s-4 py-s-3 text-center">
                      일치하는 멤버가 없습니다.
                    </li>
                  ) : (
                    <>
                      {searchResults.map((m) => {
                        const already = participantIds.has(m.memberId);
                        return (
                          <li key={m.memberId} className="border-border border-b last:border-b-0">
                            <button
                              type="button"
                              onClick={() => !already && handleAdd(m.memberId)}
                              disabled={already || updateParticipants.isPending}
                              className="hover:bg-card gap-s-3 px-s-3 py-s-2 flex w-full items-center text-left disabled:cursor-default"
                            >
                              <Avatar src={m.profileImg ?? undefined} fallback={m.name} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="text-caption truncate font-semibold">{m.name}</div>
                                <div className="text-foreground-muted text-micro truncate">
                                  {m.email}
                                </div>
                              </div>
                              <span
                                className={cn(
                                  'text-micro px-s-2 shrink-0 rounded-full py-0.5 font-bold',
                                  already
                                    ? 'bg-success-dim text-success'
                                    : 'bg-white/10 text-white',
                                )}
                              >
                                {already ? '참여 중' : <UserPlus className="h-3 w-3" />}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {hasNextMemberSearch && (
                        <li aria-hidden="true">
                          <div ref={memberSearchLoadMoreRef} className="h-4" />
                        </li>
                      )}
                      {isFetchingNextMemberSearch && (
                        <li className="px-s-3 py-s-2">
                          <Skeleton className="h-8 w-full" rounded="md" />
                        </li>
                      )}
                    </>
                  )}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
