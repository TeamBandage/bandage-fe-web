'use client';

import { ArrowLeft, ChevronRight, Crown, X } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { useSetlistStore } from '../store/setlistStore';
import type { Member, SessionDef, Song } from '../types';
import { findSession, missingCount, sessionState } from '../utils';
import { useToast } from '@/hooks/useToast';

import { MemberAvatar } from './MemberAvatar';

export interface SessionPanelProps {
  songId: string;
  /** 모바일에서 닫기 버튼 노출용. 데스크톱은 항상 노출. */
  onClose?: () => void;
}

export function SessionPanel({ songId, onClose }: SessionPanelProps) {
  // 배열 자체(stable ref) 만 select 하고 find 는 useMemo 로 — selector 내부 find/filter 는 매 렌더마다 새 참조라 무한 루프.
  const songs = useSetlistStore((s) => s.songs);
  const meetings = useSetlistStore((s) => s.meetings);
  const song = useMemo(() => songs.find((x) => x.id === songId), [songs, songId]);
  const meeting = useMemo(
    () => (song ? (meetings.find((m) => m.id === song.meetingId) ?? null) : null),
    [meetings, song],
  );
  const members = useSetlistStore((s) => s.members);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const focusedSessionId = useSetlistStore((s) => s.focusedSessionId);
  const setFocusedSession = useSetlistStore((s) => s.setFocusedSession);
  const applySession = useSetlistStore((s) => s.applySession);
  const withdrawSession = useSetlistStore((s) => s.withdrawSession);
  const confirmSession = useSetlistStore((s) => s.confirmSession);
  const unconfirmSession = useSetlistStore((s) => s.unconfirmSession);
  const toast = useToast();

  const isManager = meeting ? meeting.managerId === currentUserId : false;
  const focused = song && focusedSessionId ? findSession(song, focusedSessionId) : undefined;

  if (!song) {
    return null;
  }

  return (
    <aside
      data-slot="session-panel"
      className="bg-surface border-border hidden flex-col overflow-hidden border-l lg:flex"
      style={{ width: 380 }}
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
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground rounded-md p-1"
            aria-label="패널 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
              toast.success('세션에 지원했습니다.');
            }}
            onWithdraw={() => {
              withdrawSession(song.id, focused.id, currentUserId);
              toast.info('지원을 취소했습니다.');
            }}
            onConfirm={(uid) => {
              confirmSession(song.id, focused.id, uid);
              toast.success('세션이 확정되었습니다.');
            }}
            onUnconfirm={(uid) => {
              unconfirmSession(song.id, focused.id, uid);
              toast.info('확정이 해제되었습니다.');
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
        <div className="bg-accent-dim border-accent/25 px-s-4 py-s-3 mb-s-4 rounded-lg border">
          <div className="text-accent text-micro font-bold">
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
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onFocus(s.id)}
                className={cn(
                  'gap-s-3 px-s-3 py-s-3 hover:border-border-hi flex w-full items-center rounded-lg border transition-colors',
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
                  {s.short}
                  {s.custom && <span className="text-amber ml-0.5">*</span>}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-caption gap-s-2 flex items-center font-bold">
                    {s.label}
                    {s.custom && <span className="text-amber text-micro font-bold">커스텀</span>}
                  </div>
                  <div className="text-foreground-muted text-micro gap-s-2 mt-0.5 flex items-center">
                    <span
                      className={cn(
                        'font-mono font-bold',
                        state === 'full'
                          ? 'text-success'
                          : state === 'partial'
                            ? 'text-warn'
                            : 'text-foreground-muted',
                      )}
                    >
                      확정 {conf.length}/{s.need}
                    </span>
                    <span>·</span>
                    <span>지원 {apps.length}명</span>
                    {isMineConfirmed && (
                      <span className="text-accent font-bold">· 내가 확정됨</span>
                    )}
                    {!isMineConfirmed && isMine && (
                      <span className="text-accent font-bold">· 내가 지원함</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-foreground-muted h-4 w-4 shrink-0" />
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
                      <span className="text-accent text-micro font-bold">나</span>
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
                    >
                      확정
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}

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
          <Button variant="primary" className="w-full" onClick={onApply} disabled={isFull}>
            {isFull ? '확정 완료된 세션입니다' : '이 세션 지원하기'}
          </Button>
        )}
      </div>
    </div>
  );
}
