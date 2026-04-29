'use client';

import { CalendarDays, Clock3, Crown, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { HoveredAvailabilityPanel } from '@/domain/schedule-coordination/components/HoveredAvailabilityPanel.client';
import { MatrixView } from '@/domain/schedule-coordination/components/MatrixView.client';
import { ScheduleBoardEditor } from '@/domain/schedule-coordination/components/ScheduleBoardEditor.client';
import { ScheduleBoardList } from '@/domain/schedule-coordination/components/ScheduleBoardList.client';
import { DateRangeNav } from '@/domain/schedule-coordination/components/ViewUnitToggle.client';
import { WeeklyScheduleGrid } from '@/domain/schedule-coordination/components/WeeklyScheduleGrid.client';
import { useScheduleView } from '@/domain/schedule-coordination/hooks/useScheduleViewUnit';
import { useBoardStore } from '@/domain/schedule-coordination/store/boardStore';
import { useScheduleStore } from '@/domain/schedule-coordination/store/scheduleStore';
import { useScheduleViewStore } from '@/domain/schedule-coordination/store/scheduleViewStore';
import { useTimetableStore } from '@/domain/schedule-coordination/store/timetableStore';
import type { ScheduleBlock } from '@/domain/schedule-coordination/types';
import { suggestScheduleBoards } from '@/domain/schedule-coordination/utils/autoSuggest';
import { aggregateAvailability } from '@/domain/schedule-coordination/utils';
import { MemberAvatar } from '@/domain/setlist-meeting/components/MemberAvatar';
import { GLOBAL_MEMBER_POOL } from '@/domain/setlist-meeting/mock/memberSearchMock';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Member, Song } from '@/domain/setlist-meeting/types';
import { isReady } from '@/domain/setlist-meeting/utils';
import { cn } from '@/lib/cn';

import { ScheduleInputModal } from './ScheduleInputModal.client';

type LeftTab = 'member' | 'song' | 'board';
type SongFilter = 'mine' | 'all';
type RightPanel =
  | { kind: 'member'; member: Member }
  | { kind: 'song'; song: Song }
  | { kind: 'board'; boardId: string }
  | null;

export function SchedulingMain({ meetingId }: { meetingId: string }) {
  const meetings = useSetlistStore((s) => s.meetings);
  const songs = useSetlistStore((s) => s.songs);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const meeting = useMemo(() => meetings.find((m) => m.id === meetingId), [meetings, meetingId]);
  const allSongs = useMemo(
    () => songs.filter((s) => s.meetingId === meetingId),
    [songs, meetingId],
  );

  const isManager = meeting ? meeting.managerId === currentUserId : false;
  const participantIds = useMemo(() => meeting?.participantUserIds ?? [], [meeting]);
  const participants = useMemo<Member[]>(
    () =>
      participantIds
        .map((id) => GLOBAL_MEMBER_POOL.find((m) => m.id === id))
        .filter((m): m is Member => Boolean(m)),
    [participantIds],
  );

  const schedulesAll = useScheduleStore((s) => s.schedules);
  const memberSchedules = useMemo(
    () =>
      participantIds
        .map((uid) => schedulesAll[`${meetingId}__${uid}`])
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [participantIds, schedulesAll, meetingId],
  );

  const [leftTab, setLeftTab] = useState<LeftTab>('member');
  // 매니저 권한이 사라진 경우 board 탭은 멤버 시간표로 대체.
  const safeLeftTab: LeftTab = !isManager && leftTab === 'board' ? 'member' : leftTab;
  const viewMode = useScheduleViewStore((s) => s.modeByMeeting[meetingId] ?? 'weekly');
  const setViewMode = useScheduleViewStore((s) => s.setMode);
  const [songFilter, setSongFilter] = useState<SongFilter>('mine');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const isConfirmedTimetable = useTimetableStore((s) => Boolean(s.confirmedByMeetingId[meetingId]));

  const visibleSongs = useMemo<Song[]>(() => {
    const ready = allSongs.filter((s) => isReady(s));
    const pool = ready.length > 0 ? ready : allSongs;
    if (songFilter === 'all') return pool;
    return pool.filter(
      (s) =>
        Object.values(s.applicants).some((list) => list.includes(currentUserId)) ||
        Object.values(s.confirmed).some((list) => list.includes(currentUserId)),
    );
  }, [allSongs, songFilter, currentUserId]);

  /** 시간표 에디터 블록 풀 — 확정 곡만. */
  const editorSongPool = useMemo(
    () =>
      allSongs
        .filter((s) => isReady(s))
        .map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
    [allSongs],
  );

  /** 곡별 참여 멤버 매핑 — Task 18 곡별 가용시간 모드용. confirmed sessions 의 userId 합집합. */
  const songParticipantsMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const song of allSongs) {
      const set = new Set<string>();
      for (const list of Object.values(song.confirmed)) for (const id of list) set.add(id);
      m[song.id] = Array.from(set);
    }
    return m;
  }, [allSongs]);

  const window = meeting?.practiceWindow;
  const view = useScheduleView({
    from: window?.from ?? '',
    to: window?.to ?? '',
  });
  const { allDays, visibleDays, isInWindow, rangeLabel, compact } = view;

  // 보드 선택 시 첫 블록의 주차로 자동 점프 — 빈 주차에 갇혀 길을 잃지 않도록.
  const selectedBoard = useBoardStore((s) =>
    rightPanel?.kind === 'board' ? s.boards[rightPanel.boardId] : null,
  );
  const selectedBoardId = rightPanel?.kind === 'board' ? rightPanel.boardId : null;

  // 회의 선택 시 추천 시간표가 하나라도 있으면 항상 한 개는 선택 상태로 유지.
  // 무한 루프 방지: boards dict 를 stable ref 로 select 하고 useMemo 로 파생.
  const allBoards = useBoardStore((s) => s.boards);
  const meetingBoards = useMemo(
    () => Object.values(allBoards).filter((b) => b.meetingId === meetingId),
    [allBoards, meetingId],
  );
  useEffect(() => {
    if (!isManager) return;
    if (meetingBoards.length === 0) return;
    // 이미 이 회의의 보드가 선택돼 있다면 유지.
    if (rightPanel?.kind === 'board' && meetingBoards.some((b) => b.boardId === rightPanel.boardId))
      return;
    // 그 외 (선택 없음 / 다른 회의 보드 / 다른 종류) → 첫 보드 자동 선택.
    const first = meetingBoards[0]!;
    setRightPanel({ kind: 'board', boardId: first.boardId });
  }, [isManager, meetingBoards, rightPanel]);
  useEffect(() => {
    if (!selectedBoard || selectedBoard.blocks.length === 0) return;
    const earliest = selectedBoard.blocks.reduce(
      (acc, b) =>
        !acc || b.date < acc.date || (b.date === acc.date && b.startSlot < acc.startSlot) ? b : acc,
      selectedBoard.blocks[0],
    );
    if (earliest) view.goToDate(earliest.date);
    // 의도적으로 boardId 변경 시에만 실행 (블록 편집 시 매번 점프하면 사용자 네비를 덮어씀).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardId]);

  if (!meeting) {
    return (
      <div className="px-s-5 py-s-6">
        <p className="text-foreground-muted text-caption">회의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const completedCount = participantIds.filter(
    (uid) => schedulesAll[`${meetingId}__${uid}`]?.completed,
  ).length;

  const tabItems = [
    { id: 'member' as const, label: '멤버 시간표', badge: participants.length },
    { id: 'song' as const, label: '합주곡 시간표', badge: visibleSongs.length },
    ...(isManager ? [{ id: 'board' as const, label: '합주 시간표 생성' }] : []),
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header className="border-border px-s-5 py-s-4 border-b">
        <div className="gap-s-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-accent text-caption font-semibold">{meeting.bandName}</div>
            <h1 className="text-title-lg mt-s-1 truncate font-bold">{meeting.title}</h1>
          </div>
          {/* '나의 스케줄 입력' — 모든 탭에서 항상 같은 자리에 표시 → 헤더 높이 고정. */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setScheduleOpen(true)}
            className="shrink-0"
          >
            <Clock3 className="h-4 w-4" /> 나의 스케줄 입력
          </Button>
        </div>
        <div className="text-foreground-muted text-caption gap-s-3 mt-s-2 flex flex-wrap items-center">
          {window && (
            <span className="gap-s-1 inline-flex items-center">
              <CalendarDays className="h-3.5 w-3.5" />
              {window.from} ~ {window.to}
            </span>
          )}
          <span className="gap-s-1 inline-flex items-center">
            <Crown className="text-amber h-3.5 w-3.5" />
            매니저 {GLOBAL_MEMBER_POOL.find((m) => m.id === meeting.managerId)?.name ?? '?'}
          </span>
          <span
            className={cn(
              'text-micro px-s-2 rounded-full py-0.5 font-bold',
              isConfirmedTimetable ? 'bg-success-dim text-success' : 'bg-accent-dim text-accent',
            )}
          >
            {isConfirmedTimetable
              ? `시간표 확정 — ${completedCount}/${participants.length} 참여`
              : `${completedCount}/${participants.length} 명 일정 입력 완료`}
          </span>
        </div>
        <div
          className="bg-card border-border mt-s-3 h-2 w-full max-w-md overflow-hidden rounded-full border"
          role="progressbar"
          aria-valuenow={
            participants.length === 0 ? 0 : Math.round((completedCount / participants.length) * 100)
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="일정 입력 진행도"
        >
          <div
            className={cn(
              'h-full transition-all',
              isConfirmedTimetable ? 'bg-success' : 'bg-accent',
            )}
            style={{
              width: `${
                participants.length === 0
                  ? 0
                  : Math.round((completedCount / participants.length) * 100)
              }%`,
            }}
          />
        </div>
      </header>

      {/* 탭 영역 — 화면 전체 폭 사용. board 탭은 아래 영역 전체 활용. */}
      <div className="px-s-4 pt-s-3 border-border bg-surface border-b">
        <UnderlineTabs
          value={safeLeftTab}
          onChange={(t) => {
            setLeftTab(t);
            // 탭 전환 시 좌측 선택 종류와 우측 패널이 어긋나지 않도록 정리.
            setRightPanel((cur) => {
              if (!cur) return cur;
              if (t === 'member' && cur.kind !== 'member') return null;
              if (t === 'song' && cur.kind !== 'song') return null;
              if (t === 'board' && cur.kind !== 'board') return null;
              return cur;
            });
          }}
          items={tabItems}
        />
      </div>

      {safeLeftTab === 'board' && isManager ? (
        <div className="bg-bg flex flex-1 flex-col overflow-hidden">
          {/* 뷰 토글 — 주차별 / 매트릭스. 주차별 = 세부 슬롯 배치, 매트릭스 = 주 단위 반복 정책. */}
          <div className="px-s-3 py-s-2 border-border gap-s-2 flex items-center border-b">
            <ViewModeToggle value={viewMode} onChange={(m) => setViewMode(meetingId, m)} />
            <span className="text-foreground-muted text-micro">
              {viewMode === 'weekly'
                ? '세부 슬롯 배치 / 자동 추천'
                : '전체 기간 한눈에 / 주 단위 반복'}
            </span>
          </div>

          <div className="flex flex-1 overflow-hidden p-3">
            {viewMode === 'matrix' ? (
              <>
                {/* 좌측: 시안 카드 리스트 — 두 뷰 공통 고정 (PRD G2). */}
                <aside className="w-56 shrink-0 overflow-y-auto pr-3">
                  <ScheduleBoardList
                    meetingId={meetingId}
                    selectedBoardId={rightPanel?.kind === 'board' ? rightPanel.boardId : null}
                    onSelect={(boardId) => setRightPanel({ kind: 'board', boardId })}
                    generateRecommendations={() => {
                      const weekDays = visibleDays.filter((d) => isInWindow(d));
                      const scopeDates = weekDays.length > 0 ? weekDays : allDays;
                      const variants = suggestScheduleBoards({
                        schedules: memberSchedules,
                        dates: scopeDates,
                        songs: editorSongPool,
                        variantCount: 3,
                      });
                      return variants.map((v, idx) =>
                        v.blocks.map<ScheduleBlock>((b, i) => ({
                          ...b,
                          pinned: false,
                          paletteIndex: idx * 100 + i,
                        })),
                      );
                    }}
                  />
                </aside>
                <MatrixView
                  meetingId={meetingId}
                  boardId={rightPanel?.kind === 'board' ? rightPanel.boardId : null}
                  allDays={allDays}
                  participants={participants}
                  memberSchedules={memberSchedules}
                  songPool={editorSongPool}
                  songParticipantsMap={songParticipantsMap}
                  onWeekJump={(ws) => {
                    setViewMode(meetingId, 'weekly');
                    view.goToDate(ws);
                  }}
                />
              </>
            ) : (
              <>
                {/* 좌측: 시안 카드 리스트 — 축소 */}
                <aside className="w-56 shrink-0 overflow-y-auto pr-3">
                  <ScheduleBoardList
                    meetingId={meetingId}
                    selectedBoardId={rightPanel?.kind === 'board' ? rightPanel.boardId : null}
                    onSelect={(boardId) => setRightPanel({ kind: 'board', boardId })}
                    generateRecommendations={() => {
                      // Task 22 — 자동 시간표 생성은 *현재 선택된 주차* 의 일자에만 적용.
                      // visibleDays 는 anchor~anchor+6, 이 중 회의 가용 일자만 사용.
                      const weekDays = visibleDays.filter((d) => isInWindow(d));
                      const scopeDates = weekDays.length > 0 ? weekDays : allDays;
                      const variants = suggestScheduleBoards({
                        schedules: memberSchedules,
                        dates: scopeDates,
                        songs: editorSongPool,
                        variantCount: 3,
                      });
                      return variants.map((v, idx) =>
                        v.blocks.map<ScheduleBlock>((b, i) => ({
                          ...b,
                          pinned: false,
                          paletteIndex: idx * 100 + i,
                        })),
                      );
                    }}
                  />
                </aside>
                {/* 중앙: 시간표 에디터(블록 풀 내장). */}
                <div className="min-w-0 flex-1">
                  {rightPanel?.kind === 'board' ? (
                    <ScheduleBoardEditor
                      boardId={rightPanel.boardId}
                      days={visibleDays}
                      isInWindow={isInWindow}
                      rangeLabel={rangeLabel}
                      compact={compact}
                      onPrev={view.prev}
                      onNext={view.next}
                      onToday={view.today}
                      canPrev={view.canPrev}
                      canNext={view.canNext}
                      songPool={editorSongPool}
                      songParticipantsMap={songParticipantsMap}
                    />
                  ) : (
                    <p className="text-foreground-muted px-s-4 py-s-6 text-caption text-center">
                      좌측에서 시안을 선택하거나 ‘시간표 생성’으로 추천 안을 만들어 보세요.
                    </p>
                  )}
                </div>
                {/* 우측: 호버 기반 가능/불가능 인원 패널 (Task 23). */}
                <aside className="ml-3 w-64 shrink-0">
                  <HoveredAvailabilityPanel
                    meetingId={meetingId}
                    participants={participants}
                    memberSchedules={memberSchedules}
                    className="h-full"
                  />
                </aside>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <section className="border-border flex flex-col md:w-2/5 md:border-r">
            <div className="flex-1 overflow-y-auto" id={`tabpanel-${leftTab}`} role="tabpanel">
              {safeLeftTab === 'member' && (
                <MemberListPane
                  participants={participants}
                  meetingId={meetingId}
                  currentUserId={currentUserId}
                  schedulesAll={schedulesAll}
                  onPick={(m) => setRightPanel({ kind: 'member', member: m })}
                />
              )}
              {safeLeftTab === 'song' && (
                <SongListPane
                  songs={visibleSongs}
                  filter={songFilter}
                  onFilterChange={setSongFilter}
                  onPick={(song) => setRightPanel({ kind: 'song', song })}
                />
              )}
            </div>
          </section>
          <section className="bg-bg flex flex-1 flex-col overflow-hidden md:w-3/5">
            <RightVisualization
              panel={rightPanel}
              onClose={() => setRightPanel(null)}
              meetingId={meetingId}
              visibleDays={visibleDays}
              participants={participants}
              memberSchedules={memberSchedules}
              view={view}
            />
          </section>
        </div>
      )}

      {scheduleOpen && (
        <ScheduleInputModal
          meetingId={meetingId}
          userId={currentUserId}
          allDays={allDays}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
        />
      )}
    </div>
  );
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: 'weekly' | 'matrix';
  onChange: (v: 'weekly' | 'matrix') => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="시간표 뷰 모드"
      className="bg-card border-border inline-flex rounded-md border p-0.5"
    >
      {(['weekly', 'matrix'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={value === m}
          onClick={() => onChange(m)}
          className={cn(
            'text-micro px-s-3 rounded py-1 font-bold transition-colors',
            value === m
              ? 'bg-accent text-foreground'
              : 'text-foreground-muted hover:text-foreground',
          )}
        >
          {m === 'weekly' ? '주차별' : '매트릭스'}
        </button>
      ))}
    </div>
  );
}

function MemberListPane({
  participants,
  meetingId,
  currentUserId,
  schedulesAll,
  onPick,
}: {
  participants: Member[];
  meetingId: string;
  currentUserId: string;
  schedulesAll: ReturnType<typeof useScheduleStore.getState>['schedules'];
  onPick: (m: Member) => void;
}) {
  return (
    <ul>
      {participants.map((m) => {
        const sched = schedulesAll[`${meetingId}__${m.id}`];
        const completed = sched?.completed === true;
        const partial = !!sched && !completed;
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onPick(m)}
              className="hover:bg-card border-border px-s-4 py-s-3 gap-s-3 flex w-full items-center border-b text-left"
            >
              <MemberAvatar member={m} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-caption truncate font-semibold">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="text-accent text-micro ml-s-2 font-bold">나</span>
                  )}
                </div>
                <div className="text-foreground-muted text-micro truncate">{m.email ?? m.role}</div>
              </div>
              <span
                className={cn(
                  'text-micro px-s-2 shrink-0 rounded-full py-0.5 font-bold',
                  completed
                    ? 'bg-success-dim text-success'
                    : partial
                      ? 'bg-warn-dim text-warn'
                      : 'bg-card text-foreground-muted',
                )}
              >
                {completed ? '완료' : partial ? '입력 중' : '미입력'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SongListPane({
  songs,
  filter,
  onFilterChange,
  onPick,
}: {
  songs: Song[];
  filter: SongFilter;
  onFilterChange: (v: SongFilter) => void;
  onPick: (s: Song) => void;
}) {
  return (
    <div>
      <div className="border-border px-s-4 py-s-2 border-b">
        <UnderlineTabs<SongFilter>
          value={filter}
          onChange={onFilterChange}
          items={[
            { id: 'mine', label: '내 합주곡' },
            { id: 'all', label: '전체' },
          ]}
        />
      </div>
      <ul>
        {songs.length === 0 ? (
          <li className="text-foreground-muted py-s-8 text-caption text-center">
            {filter === 'mine' ? '내가 참여한 합주곡이 없습니다.' : '합주곡이 없습니다.'}
          </li>
        ) : (
          songs.map((song) => (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => onPick(song)}
                className="hover:bg-card border-border px-s-4 py-s-3 gap-s-3 flex w-full items-center border-b text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-caption truncate font-bold">{song.title}</div>
                  <div className="text-foreground-muted text-micro truncate">
                    {song.artist}
                    {song.duration ? ` · ${song.duration}` : ''}
                  </div>
                </div>
                {isReady(song) && (
                  <span className="bg-success-dim text-success text-micro px-s-2 shrink-0 rounded-full py-0.5 font-bold">
                    합주 가능
                  </span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function RightVisualization({
  panel,
  onClose,
  meetingId,
  visibleDays,
  participants,
  memberSchedules,
  view,
}: {
  panel: RightPanel;
  onClose: () => void;
  meetingId: string;
  visibleDays: string[];
  participants: Member[];
  memberSchedules: ReturnType<typeof useScheduleStore.getState>['schedules'][string][];
  view: ReturnType<typeof useScheduleView>;
}) {
  if (!panel) {
    return (
      <div className="text-foreground-muted px-s-6 py-s-8 m-auto max-w-md text-center">
        <p className="text-body font-bold">좌측에서 항목을 선택하세요</p>
        <p className="text-caption mt-s-2">
          멤버 또는 합주곡을 선택하면 우측에 시각화가 표시됩니다.
        </p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <header className="border-border px-s-5 py-s-3 gap-s-3 flex items-start justify-between border-b">
        <div className="min-w-0">
          <div className="text-foreground-muted text-micro font-bold uppercase">
            {panel.kind === 'member' ? '멤버 일정' : '곡 합주 가능 매트릭스'}
          </div>
          <div className="text-subtitle mt-s-1 truncate font-bold">
            {panel.kind === 'member'
              ? panel.member.name
              : panel.kind === 'song'
                ? panel.song.title
                : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-foreground-muted hover:text-foreground rounded-md p-1"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="px-s-5 py-s-3 border-border border-b">
        <DateRangeNav
          rangeLabel={view.rangeLabel}
          compact={view.compact}
          onPrev={view.prev}
          onNext={view.next}
          onToday={view.today}
          canPrev={view.canPrev}
          canNext={view.canNext}
        />
      </div>
      <div className="px-s-3 py-s-3 flex-1 overflow-hidden">
        {panel.kind === 'member' ? (
          <MemberSchedulePanel
            member={panel.member}
            meetingId={meetingId}
            visibleDays={visibleDays}
            isInWindow={view.isInWindow}
          />
        ) : (
          <SongMatrixPanel
            memberSchedules={memberSchedules}
            participants={participants}
            visibleDays={visibleDays}
            isInWindow={view.isInWindow}
          />
        )}
      </div>
    </div>
  );
}

function MemberSchedulePanel({
  member,
  meetingId,
  visibleDays,
  isInWindow,
}: {
  member: Member;
  meetingId: string;
  visibleDays: string[];
  isInWindow: (date: string) => boolean;
}) {
  const sched = useScheduleStore((s) => s.schedules[`${meetingId}__${member.id}`]);
  return (
    <div className="flex h-full flex-col gap-3">
      {sched ? (
        <WeeklyScheduleGrid
          days={visibleDays}
          slotStart={18}
          slotEnd={44}
          isInWindow={isInWindow}
          cellClassName={(d, s, inWindow) => {
            if (!inWindow) return undefined;
            if (!sched.availableDates.includes(d)) return undefined;
            const mask = sched.blocks[d];
            if (mask?.[s]) return 'bg-accent/70';
            return undefined;
          }}
        />
      ) : (
        <p className="text-foreground-muted text-caption px-s-3">
          {member.name}님은 아직 일정을 입력하지 않았습니다.
        </p>
      )}
      {sched?.note && (
        <div className="bg-card border-border px-s-3 py-s-2 rounded-md border">
          <div className="text-foreground-muted text-micro mb-1 font-bold uppercase">특이사항</div>
          <p className="text-foreground text-caption leading-relaxed whitespace-pre-wrap">
            {sched.note}
          </p>
        </div>
      )}
      {sched && (
        <div className="text-foreground-muted text-micro px-s-1">
          {sched.completed ? '입력 완료' : '입력 중'} · 갱신{' '}
          {sched.updatedAt.slice(0, 16).replace('T', ' ')}
        </div>
      )}
    </div>
  );
}

function SongMatrixPanel({
  memberSchedules,
  participants,
  visibleDays,
  isInWindow,
}: {
  memberSchedules: ReturnType<typeof useScheduleStore.getState>['schedules'][string][];
  participants: Member[];
  visibleDays: string[];
  isInWindow: (date: string) => boolean;
}) {
  const aggregate = useMemo(
    () => aggregateAvailability(memberSchedules, visibleDays),
    [memberSchedules, visibleDays],
  );
  const total = participants.length;
  const colorOf = (count: number): string | undefined => {
    if (count === 0) return undefined;
    const ratio = total === 0 ? 0 : count / total;
    if (ratio < 0.3) return 'bg-warn/40';
    if (ratio < 0.6) return 'bg-warn/70';
    if (ratio < 0.9) return 'bg-accent/70';
    return 'bg-success';
  };
  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-foreground-muted text-caption px-s-1">
        참여 {total}명 기준 동시 가능 시간 — 진할수록 가능 인원 많음.
      </p>
      <WeeklyScheduleGrid
        days={visibleDays}
        slotStart={18}
        slotEnd={44}
        isInWindow={isInWindow}
        cellClassName={(d, s, inWindow) => {
          if (!inWindow) return undefined;
          const c = aggregate[d]?.[s] ?? 0;
          return colorOf(c);
        }}
      />
    </div>
  );
}
