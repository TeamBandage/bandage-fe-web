'use client';

import { ArrowLeft, ChevronRight, Crown } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { useMe } from '@/domain/member/hooks/useMe';
import { useApplyForSession } from '@/domain/track-selection/hooks/useApplyForSession';
import { useWithdrawSession } from '@/domain/track-selection/hooks/useWithdrawSession';
import { useUpdateSessionConfirmations } from '@/domain/track-selection/hooks/useUpdateSessionConfirmations';

import { useSetlistStore } from '../store/setlistStore';
import type { Member, SessionDef, Song } from '../types';
import { displaySessionShort, findSession, missingCount, sessionState } from '../utils';
import { useToast } from '@/hooks/useToast';

import { MemberAvatar } from './MemberAvatar';

export interface SessionPanelProps {
  songId: string;
  /** 실 API 기반 선곡 ID (meetingId와 동일). 세션 지원/철회/확정 API 호출에 필요. */
  selectionId: string;
  /** 밴드 멤버 목록 — MeetingDetail에서 TanStack Query로 패치 후 전달. */
  members: Member[];
  /** 실 API 기준 매니저 여부 — 미전달 시 mock store fallback */
  isManager?: boolean;
}

export function SessionPanel({
  songId,
  selectionId,
  members: rawMembers,
  isManager: isManagerProp,
}: SessionPanelProps) {
  // 배열 자체(stable ref) 만 select 하고 find 는 useMemo 로 — selector 내부 find/filter 는 매 렌더마다 새 참조라 무한 루프.
  const songs = useSetlistStore((s) => s.songs);
  const meetings = useSetlistStore((s) => s.meetings);
  const song = useMemo(() => songs.find((x) => x.id === songId), [songs, songId]);
  const meeting = useMemo(
    () => (song ? (meetings.find((m) => m.id === song.meetingId) ?? null) : null),
    [meetings, song],
  );
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const focusedSessionId = useSetlistStore((s) => s.focusedSessionId);
  const { data: me } = useMe();
  // 실 유저가 전달된 members에 없을 때 임시 Member 합성 (아바타·이름 표시용)
  const members: Member[] = useMemo(() => {
    if (!currentUserId || rawMembers.some((m) => m.id === currentUserId)) return rawMembers;
    const meMember: Member = {
      id: currentUserId,
      name: me?.name ?? '나',
      role: '',
      avatar: 'var(--color-border-hi)',
      profileImg: me?.profileImg ?? undefined,
    };
    return [...rawMembers, meMember];
  }, [rawMembers, currentUserId, me]);
  const setFocusedSession = useSetlistStore((s) => s.setFocusedSession);
  const applySession = useSetlistStore((s) => s.applySession);
  const withdrawSession = useSetlistStore((s) => s.withdrawSession);
  const confirmSession = useSetlistStore((s) => s.confirmSession);
  const unconfirmSession = useSetlistStore((s) => s.unconfirmSession);

  const applyMutation = useApplyForSession(selectionId);
  const withdrawMutation = useWithdrawSession(selectionId);
  const confirmMutation = useUpdateSessionConfirmations(selectionId);

  const toast = useToast();

  const isManager = isManagerProp ?? (meeting ? meeting.managerId === currentUserId : false);
  const focused = song && focusedSessionId ? findSession(song, focusedSessionId) : undefined;

  if (!song) {
    return null;
  }

  return (
    <aside
      data-slot="session-panel"
      className="bg-surface border-border flex min-h-0 flex-1 flex-col overflow-hidden border-l"
      aria-label="세션 지원 패널"
    >
      <header className="border-border px-s-5 py-s-4 gap-s-3 flex items-start justify-between border-b">
        <div className="min-w-0 flex-1">
          <div className="text-foreground-muted text-micro gap-s-2 flex items-center font-bold tracking-wider uppercase">
            <span>{focused ? `${focused.label} 세션` : '세션 지원'}</span>
            {isManager && (
              <span className="text-amber gap-s-1 inline-flex items-center font-semibold">
                <Crown className="h-3 w-3" /> 매니저
              </span>
            )}
          </div>
          <div className="text-subtitle mt-s-1 truncate font-bold">{song.title}</div>
          <div className="text-foreground-sub text-caption mt-0.5">{song.artist}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {focused ? (
          <FocusedSessionView
            song={song}
            session={focused}
            members={members}
            currentUserId={currentUserId}
            isManager={isManager}
            onBack={() => setFocusedSession(null)}
            onApply={() => {
              applySession(song.id, focused.id, currentUserId);
              applyMutation.mutate(
                { itemId: song.id, sessionId: focused.id },
                {
                  onSuccess: () => toast.success('세션에 지원했습니다.'),
                  onError: () => {
                    withdrawSession(song.id, focused.id, currentUserId);
                    toast.error('지원에 실패했습니다.');
                  },
                },
              );
            }}
            onWithdraw={() => {
              withdrawSession(song.id, focused.id, currentUserId);
              withdrawMutation.mutate(
                { itemId: song.id, sessionId: focused.id, userId: Number(currentUserId) },
                {
                  onSuccess: () => toast.info('지원을 취소했습니다.'),
                  onError: () => {
                    applySession(song.id, focused.id, currentUserId);
                    toast.error('지원 취소에 실패했습니다.');
                  },
                },
              );
            }}
            onConfirm={(uid) => {
              confirmSession(song.id, focused.id, uid);
              confirmMutation.mutate(
                { itemId: song.id, sessionId: focused.id, confirm: [Number(uid)], unconfirm: [] },
                {
                  onSuccess: () => toast.success('세션이 확정되었습니다.'),
                  onError: () => {
                    unconfirmSession(song.id, focused.id, uid);
                    toast.error('확정에 실패했습니다.');
                  },
                },
              );
            }}
            onUnconfirm={(uid) => {
              unconfirmSession(song.id, focused.id, uid);
              confirmMutation.mutate(
                { itemId: song.id, sessionId: focused.id, confirm: [], unconfirm: [Number(uid)] },
                {
                  onSuccess: () => toast.info('확정이 해제되었습니다.'),
                  onError: () => {
                    confirmSession(song.id, focused.id, uid);
                    toast.error('확정 해제에 실패했습니다.');
                  },
                },
              );
            }}
          />
        ) : (
          <OverviewSessionView
            song={song}
            members={members}
            onFocus={(sid) => setFocusedSession(sid)}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </aside>
  );
}

function OverviewSessionView({
  song,
  members,
  onFocus,
  currentUserId,
}: {
  song: Song;
  members: Member[];
  onFocus: (sessionId: string) => void;
  currentUserId: string;
}) {
  const proposer = members.find((m) => m.id === song.proposerId);
  const missing = missingCount(song);

  return (
    <div className="px-s-5 py-s-4">
      {song.note && (
        <div className="px-s-4 py-s-3 mb-s-4 rounded-lg border border-white/25 bg-white/10">
          <div className="text-micro font-bold text-white">
            추천자 의견 · {proposer?.name ?? '?'}
          </div>
          <p className="text-foreground text-caption mt-s-1 leading-relaxed">{song.note}</p>
        </div>
      )}

      <div className="text-foreground-muted text-micro mb-s-3 font-bold tracking-wider uppercase">
        세션 구성 · {missing === 0 ? '모두 확정됨' : `${missing}자리 미확정`}
      </div>

      <ul className="gap-s-2 flex flex-col">
        {song.sessions.map((s) => {
          const apps = song.applicants[s.id] ?? [];
          const conf = song.confirmed[s.id] ?? [];
          const state = sessionState(conf, s.need);
          const isMine = apps.includes(currentUserId);
          const isMineConfirmed = conf.includes(currentUserId);
          const tone =
            state === 'full'
              ? 'border-success/30 bg-success-dim/40'
              : state === 'partial'
                ? 'border-warn/30 bg-warn-dim/40'
                : 'border-border bg-card';
          // 카드의 정체성: 누가 이 세션을 맡는지 한눈에 보여주는 것.
          // 1순위: 확정자(이름·아바타). 2순위: 지원자 미니 그룹. 3순위: '미확정'.
          const fallback = (uid: string): Member => ({
            id: uid,
            name: `멤버 #${uid}`,
            role: '',
            avatar: 'var(--color-border-hi)',
          });
          const confirmedMembers = conf.map(
            (uid) => members.find((m) => m.id === uid) ?? fallback(uid),
          );
          const applicantMembers = apps
            .filter((uid) => !conf.includes(uid))
            .map((uid) => members.find((m) => m.id === uid) ?? fallback(uid));
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onFocus(s.id)}
                className={cn(
                  'gap-s-3 px-s-3 py-s-3 hover:border-border-hi flex w-full items-start rounded-lg border transition-colors',
                  tone,
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-extrabold',
                    state === 'full'
                      ? 'border-success/40 text-success'
                      : state === 'partial'
                        ? 'border-warn/40 text-warn'
                        : 'border-border text-foreground-muted',
                  )}
                >
                  {displaySessionShort(s, song.sessions)}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  {/* 1행: 라벨 + 우측 경쟁률 칩 */}
                  <div className="gap-s-2 flex items-center justify-between">
                    <div className="text-caption gap-s-2 flex items-center font-bold">
                      {s.label}
                      {s.custom && <span className="text-amber text-micro font-bold">커스텀</span>}
                    </div>
                    <span
                      className={cn(
                        'px-s-2 text-micro rounded-full py-0.5 font-mono font-bold',
                        state === 'full'
                          ? 'bg-success-dim text-success'
                          : apps.length > 0
                            ? 'bg-warn-dim text-warn'
                            : 'bg-card text-foreground-muted',
                      )}
                    >
                      지원 {apps.length}/{s.need}
                    </span>
                  </div>
                  {/* 2행: 멤버 표시 — 확정자 우선, 없으면 지원자 미니 그룹 */}
                  <div className="mt-s-2 gap-s-2 flex flex-wrap items-center">
                    {confirmedMembers.length > 0 ? (
                      confirmedMembers.map((m) => (
                        <span
                          key={m.id}
                          className="bg-success/15 border-success/35 gap-s-1 px-s-2 inline-flex items-center rounded-full border py-0.5"
                        >
                          <MemberAvatar member={m} size="sm" className="-ml-1" />
                          <span className="text-caption font-semibold">{m.name}</span>
                          {m.id === currentUserId && (
                            <span className="text-micro font-bold text-white">나</span>
                          )}
                          <span className="text-success text-micro font-bold">확정</span>
                        </span>
                      ))
                    ) : applicantMembers.length > 0 ? (
                      <span className="gap-s-1 flex items-center">
                        <span className="flex -space-x-1.5">
                          {applicantMembers.slice(0, 4).map((m) => (
                            <MemberAvatar
                              key={m.id}
                              member={m}
                              size="sm"
                              className="border-card border-2"
                            />
                          ))}
                        </span>
                        <span className="text-foreground-muted text-micro">
                          {applicantMembers.length === 1
                            ? applicantMembers[0]!.name
                            : `${applicantMembers[0]!.name} 외 ${applicantMembers.length - 1}명`}
                          {' 지원'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-foreground-muted text-micro">미확정 · 지원자 없음</span>
                    )}
                    {isMine && !isMineConfirmed && (
                      <span className="text-micro px-s-2 rounded-full bg-white/10 py-0.5 font-bold text-white">
                        내 지원
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-foreground-muted mt-s-1 h-4 w-4 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FocusedSessionView({
  song,
  session,
  members,
  currentUserId,
  isManager,
  onBack,
  onApply,
  onWithdraw,
  onConfirm,
  onUnconfirm,
}: {
  song: Song;
  session: SessionDef;
  members: Member[];
  currentUserId: string;
  isManager: boolean;
  onBack: () => void;
  onApply: () => void;
  onWithdraw: () => void;
  onConfirm: (userId: string) => void;
  onUnconfirm: (userId: string) => void;
}) {
  const apps = useMemo(() => song.applicants[session.id] ?? [], [song.applicants, session.id]);
  const conf = useMemo(() => song.confirmed[session.id] ?? [], [song.confirmed, session.id]);
  const isMineApplied = apps.includes(currentUserId);
  const isMineConfirmed = conf.includes(currentUserId);
  const isFull = conf.length >= session.need;

  // 확정된 사람을 위로 정렬.
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => {
      const ac = conf.includes(a);
      const bc = conf.includes(b);
      if (ac && !bc) return -1;
      if (!ac && bc) return 1;
      return 0;
    });
  }, [apps, conf]);

  return (
    <div className="px-s-5 py-s-4">
      <button
        type="button"
        onClick={onBack}
        className="text-foreground-sub gap-s-1 mb-s-4 text-caption hover:text-foreground inline-flex items-center font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> 모든 세션
      </button>

      <div className="bg-card border-border px-s-4 py-s-3 mb-s-4 rounded-lg border">
        <div className="mb-s-2 flex items-center justify-between">
          <div className="text-subtitle gap-s-2 flex items-center font-extrabold">
            {session.label}
            {session.custom && <span className="text-amber text-micro font-bold">커스텀</span>}
          </div>
          <span
            className={cn(
              'px-s-3 text-micro rounded-full py-0.5 font-mono font-bold',
              isFull ? 'bg-success-dim text-success' : 'bg-warn-dim text-warn',
            )}
          >
            {conf.length}/{session.need} {isFull ? '확정 완료' : '확정 대기'}
          </span>
        </div>
        <div className="text-foreground-sub text-caption gap-s-2 flex items-center">
          <span>
            지원자 <strong className="text-foreground">{apps.length}명</strong>
          </span>
          <span className="text-foreground-muted">·</span>
          <span>
            필요 <strong className="text-foreground">{session.need}명</strong>
          </span>
        </div>
      </div>

      <div className="mb-s-3 flex items-center justify-between">
        <span className="text-foreground-muted text-micro font-bold tracking-wider uppercase">
          지원자 ({apps.length})
        </span>
        {isManager && apps.length > 0 && (
          <span className="bg-amber-dim text-amber text-micro px-s-2 rounded-md py-0.5 font-bold">
            매니저: 확정 가능
          </span>
        )}
      </div>

      {apps.length === 0 ? (
        <div className="bg-card border-border text-foreground-muted px-s-4 py-s-6 text-caption rounded-lg border border-dashed text-center">
          아직 지원자가 없습니다.
        </div>
      ) : (
        <ul className="gap-s-2 flex flex-col">
          {sortedApps.map((uid) => {
            const m = members.find((mm) => mm.id === uid);
            const userConfirmed = conf.includes(uid);
            return (
              <li
                key={uid}
                className={cn(
                  'gap-s-3 px-s-3 py-s-2 flex items-center rounded-lg border',
                  userConfirmed ? 'border-success/40 bg-success-dim/20' : 'border-border bg-card',
                )}
              >
                <MemberAvatar member={m} />
                <div className="min-w-0 flex-1">
                  <div className="text-caption gap-s-2 flex items-center font-semibold">
                    <span className="truncate">{m?.name ?? '?'}</span>
                    {uid === currentUserId && (
                      <span className="text-micro font-bold text-white">나</span>
                    )}
                    {m?.role && (
                      <span className="text-foreground-muted text-micro">· {m.role}</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-micro mt-0.5 font-semibold',
                      userConfirmed ? 'text-success' : 'text-foreground-muted',
                    )}
                  >
                    {userConfirmed ? '확정됨' : '지원 완료'}
                  </div>
                </div>
                {isManager &&
                  (userConfirmed ? (
                    <Button size="sm" variant="ghost" onClick={() => onUnconfirm(uid)}>
                      해제
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isFull}
                      onClick={() => onConfirm(uid)}
                      className="bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
                    >
                      확정
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}

      {!(isManager && isMineConfirmed) && (
        <div className="border-border mt-s-5 pt-s-4 border-t">
          {isMineConfirmed ? (
            <div className="text-foreground-muted text-caption text-center">
              확정된 세션은 본인이 직접 취소할 수 없습니다. 매니저에게 문의해 주세요.
            </div>
          ) : isMineApplied ? (
            <Button variant="ghost" className="w-full" onClick={onWithdraw}>
              지원 취소
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
              onClick={onApply}
              disabled={isFull}
            >
              {isFull ? '확정 완료된 세션입니다' : '이 세션 지원하기'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
