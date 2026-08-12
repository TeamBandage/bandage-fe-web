'use client';

import { Loader2, Search, UserMinus, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { useMemberSearch } from '@/domain/member/hooks/useMemberSearch';
import { useUpdateParticipants } from '@/domain/track-selection/hooks/useUpdateParticipants';
import type { TrackSelectionParticipant } from '@/domain/track-selection/types/res';
import { resolveMemberId } from '@/domain/track-selection/utils/resolveMemberId';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import type { Member } from '../types';

export interface ParticipantsModalProps {
  selectionId: string;
  bandIds: string[];
  participants: TrackSelectionParticipant[];
  members: Member[];
  currentUserId: string;
  readOnly?: boolean;
  onClose: () => void;
}

export function ParticipantsModal({
  selectionId,
  bandIds,
  participants,
  members,
  currentUserId,
  readOnly = false,
  onClose,
}: ParticipantsModalProps) {
  const [memberQuery, setMemberQuery] = useState('');
  const toast = useToast();
  const updateParticipants = useUpdateParticipants(selectionId);
  const { data: searchResults = [], isFetching: searching } = useMemberSearch(memberQuery);

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
              현재 참여자 ({participants.length})
            </p>
            <ul className="gap-s-1 flex flex-col">
              {participants.flatMap((p) => {
                const memberId = resolveMemberId(p);
                if (memberId === undefined) return [];
                const member = members.find((m) => m.id === String(memberId));
                const name = member?.name ?? p.member?.name ?? `멤버 #${memberId}`;
                const isSelf = String(memberId) === currentUserId;
                return (
                  <li
                    key={memberId}
                    className="bg-card border-border gap-s-3 px-s-3 py-s-2 flex items-center rounded-md border"
                  >
                    <Avatar
                      src={member?.profileImg ?? p.member?.profileImg ?? undefined}
                      fallback={name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-caption font-semibold">{name}</span>
                      {isSelf && <span className="text-micro ml-s-2 font-bold text-white">나</span>}
                    </div>
                    {!readOnly && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemove(memberId)}
                        disabled={updateParticipants.isPending}
                        aria-label={`${name} 제거`}
                        className={cn(
                          'text-foreground-muted hover:text-danger rounded-md p-1 transition-colors',
                          updateParticipants.isPending && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </li>
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
                    searchResults.map((m) => {
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
                                already ? 'bg-success-dim text-success' : 'bg-white/10 text-white',
                              )}
                            >
                              {already ? '참여 중' : <UserPlus className="h-3 w-3" />}
                            </span>
                          </button>
                        </li>
                      );
                    })
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
