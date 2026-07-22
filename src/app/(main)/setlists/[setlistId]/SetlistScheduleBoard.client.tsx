'use client';

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Divider } from '@/components/ui/divider';
import { Input } from '@/components/ui/input';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { Textarea } from '@/components/ui/textarea';
import { songTone } from '@/domain/schedule-coordination/components/palette';
import { WeeklyScheduleGrid } from '@/domain/schedule-coordination/components/WeeklyScheduleGrid.client';
import { enumerateDays, slotToTime, toLocalISODate } from '@/domain/schedule-coordination/utils';
import { useCreateScheduleBoard } from '@/domain/setlist/hooks/useCreateScheduleBoard';
import { useDeleteScheduleBlock } from '@/domain/setlist/hooks/useDeleteScheduleBlock';
import { useDeleteScheduleBoard } from '@/domain/setlist/hooks/useDeleteScheduleBoard';
import { useScheduleBoards } from '@/domain/setlist/hooks/useScheduleBoards';
import { useSetScheduleBlockPin } from '@/domain/setlist/hooks/useSetScheduleBlockPin';
import { useUpdateScheduleBoard } from '@/domain/setlist/hooks/useUpdateScheduleBoard';
import { useUpsertScheduleBlock } from '@/domain/setlist/hooks/useUpsertScheduleBlock';
import type {
  ScheduleBlockRecurrenceRequest,
  ScheduleBoardConstraints,
  ScheduleBoardCreateRequest,
} from '@/domain/setlist/types/req';
import type {
  ScheduleBlockResponse,
  ScheduleBoardResponse,
  SetlistTrackResponse,
} from '@/domain/setlist/types/res';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

/** 표시 범위 10:00~24:00 (slot 0=00:00, 30분 단위). */
const SLOT_START = 20;
const SLOT_END = 48;
const DEFAULT_DURATION_SLOTS = 4;

const TRACK_DRAG_TYPE = 'application/x-track-id';
const BLOCK_DRAG_TYPE = 'application/x-block-id';

const DEFAULT_CONSTRAINTS: ScheduleBoardConstraints = {
  workingHoursStart: 9,
  workingHoursEnd: 22,
  excludeLateNight: true,
  maxConsecutiveMinutes: 240,
};

function mondayOf(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function durationSlotsOf(track: SetlistTrackResponse): number {
  return track.duration ? Math.max(2, Math.ceil(track.duration / 60 / 30)) : DEFAULT_DURATION_SLOTS;
}

function spanOf(block: { startSlot: number; endSlot: number }): number {
  return block.endSlot - block.startSlot + 1;
}

/**
 * 임시 mock — 멤버 가용 시간 API 연동 전까지 memberId+날짜+슬롯 기반 결정적 패턴으로
 * 가능/불가능을 대략 2:1 비율로 나눠 보여준다. 실제 가용 데이터가 아님.
 */
function hashOf(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  return hash;
}

function mockIsAvailable(memberId: number, dateSlotKey: string): boolean {
  return hashOf(`${memberId}-${dateSlotKey}`) % 3 !== 0;
}

const MOCK_UNAVAILABLE_REASONS = ['선약', '시간'] as const;

function mockUnavailableReason(memberId: number, dateSlotKey: string): string {
  const idx = hashOf(`reason-${memberId}-${dateSlotKey}`) % MOCK_UNAVAILABLE_REASONS.length;
  return MOCK_UNAVAILABLE_REASONS[idx]!;
}

interface MockSessionMember {
  memberId: number;
  name: string;
  role: string;
  avatarColor: string;
}

/** 임시 mock 멤버 목록 — 실제 셋리스트 세션 참여자/가용 시간 API 연동 전까지 사용. */
const MOCK_SESSION_MEMBERS: MockSessionMember[] = [
  { memberId: 1, name: '정선우', role: '기타', avatarColor: '#F5A623' },
  { memberId: 2, name: '이정빈', role: '베이스', avatarColor: '#E5484D' },
  { memberId: 3, name: '유승희', role: '보컬', avatarColor: '#3B82F6' },
  { memberId: 4, name: '조수빈', role: '드럼', avatarColor: '#8B5CF6' },
  { memberId: 5, name: '채민주', role: '키보드', avatarColor: '#22D3EE' },
];

function MemberRow({
  member,
  tone,
  reason,
}: {
  member: MockSessionMember;
  tone: 'available' | 'unavailable' | 'neutral';
  reason?: string;
}) {
  return (
    <div
      className={cn(
        'gap-s-2 flex items-center rounded-lg px-2 py-1.5',
        tone === 'available' && 'bg-success-dim/30 border-success/20 border',
        tone === 'unavailable' && 'bg-danger-dim/20 border-danger/20 border',
      )}
    >
      <span
        className="text-caption inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.name.slice(0, 1)}
      </span>
      <span className="text-caption min-w-0 flex-1 truncate font-semibold">{member.name}</span>
      <span className="text-foreground-muted text-micro shrink-0">{member.role}</span>
      {reason && (
        <span className="bg-danger/20 text-danger text-micro shrink-0 rounded-full px-2 py-0.5 font-bold">
          {reason}
        </span>
      )}
    </div>
  );
}

type BoardModalState = { mode: 'create' } | { mode: 'edit'; board: ScheduleBoardResponse } | null;

function ScheduleBoardFormModal({
  open,
  mode,
  initial,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial: ScheduleBoardResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: ScheduleBoardCreateRequest) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [windowFrom, setWindowFrom] = useState('');
  const [windowTo, setWindowTo] = useState('');
  const [workingHoursStart, setWorkingHoursStart] = useState(DEFAULT_CONSTRAINTS.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(DEFAULT_CONSTRAINTS.workingHoursEnd);
  const [excludeLateNight, setExcludeLateNight] = useState(DEFAULT_CONSTRAINTS.excludeLateNight);
  const [maxConsecutiveMinutes, setMaxConsecutiveMinutes] = useState(
    DEFAULT_CONSTRAINTS.maxConsecutiveMinutes,
  );

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setWindowFrom(initial.windowFrom ?? '');
      setWindowTo(initial.windowTo ?? '');
      setWorkingHoursStart(initial.constraints.workingHoursStart);
      setWorkingHoursEnd(initial.constraints.workingHoursEnd);
      setExcludeLateNight(initial.constraints.excludeLateNight);
      setMaxConsecutiveMinutes(initial.constraints.maxConsecutiveMinutes);
    } else {
      setName('');
      setWindowFrom('');
      setWindowTo('');
      setWorkingHoursStart(DEFAULT_CONSTRAINTS.workingHoursStart);
      setWorkingHoursEnd(DEFAULT_CONSTRAINTS.workingHoursEnd);
      setExcludeLateNight(DEFAULT_CONSTRAINTS.excludeLateNight);
      setMaxConsecutiveMinutes(DEFAULT_CONSTRAINTS.maxConsecutiveMinutes);
    }
  }, [open, mode, initial]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      windowFrom: windowFrom || undefined,
      windowTo: windowTo || undefined,
      constraints: {
        workingHoursStart,
        workingHoursEnd,
        excludeLateNight,
        maxConsecutiveMinutes,
      },
    });
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>
            {mode === 'create' ? '새 시간표 시안' : '시안 설정'}
          </ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={handleSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="시안 이름"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 1차 시안"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="적용 시작일"
                  type="date"
                  value={windowFrom}
                  onChange={(e) => setWindowFrom(e.target.value)}
                />
                <Input
                  label="적용 종료일"
                  type="date"
                  value={windowTo}
                  onChange={(e) => setWindowTo(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="근무시간 시작"
                  type="number"
                  min={0}
                  max={23}
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(Number(e.target.value))}
                />
                <Input
                  label="근무시간 종료"
                  type="number"
                  min={0}
                  max={23}
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(Number(e.target.value))}
                />
              </div>
              <Input
                label="최대 연속 배치 시간 (분)"
                type="number"
                min={30}
                step={30}
                value={maxConsecutiveMinutes}
                onChange={(e) => setMaxConsecutiveMinutes(Number(e.target.value))}
              />
              <label className="gap-s-2 flex items-center">
                <input
                  type="checkbox"
                  checked={excludeLateNight}
                  onChange={(e) => setExcludeLateNight(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-caption">심야(근무시간 이후) 배치 금지</span>
              </label>
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter>
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button type="submit" variant="primary" disabled={!name.trim() || isPending}>
              {mode === 'create' ? '만들기' : '저장'}
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

const RECURRENCE_FREQ_OPTIONS: { value: ScheduleBlockRecurrenceRequest['freq']; label: string }[] =
  [
    { value: 'NONE', label: '반복 안함' },
    { value: 'DAILY', label: '매일' },
    { value: 'WEEKLY', label: '매주' },
    { value: 'BIWEEKLY', label: '격주' },
  ];

function BlockSettingsModal({
  open,
  block,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  block: ScheduleBlockResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    title: string;
    note: string;
    recurrence: ScheduleBlockRecurrenceRequest;
  }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [freq, setFreq] = useState<ScheduleBlockRecurrenceRequest['freq']>('NONE');
  const [interval, setIntervalValue] = useState(1);
  const [endMode, setEndMode] = useState<'until' | 'count'>('until');
  const [until, setUntil] = useState('');
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!open || !block) return;
    setTitle(block.title ?? '');
    setNote(block.note ?? '');
    setFreq(block.recurrence.freq);
    setIntervalValue(block.recurrence.interval || 1);
    if (block.recurrence.count) {
      setEndMode('count');
      setCount(block.recurrence.count);
      setUntil('');
    } else {
      setEndMode('until');
      setUntil(block.recurrence.until ?? '');
      setCount(1);
    }
  }, [open, block]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const recurrence: ScheduleBlockRecurrenceRequest =
      freq === 'NONE'
        ? { freq: 'NONE', interval: 1 }
        : {
            freq,
            interval,
            until: endMode === 'until' ? until || undefined : undefined,
            count: endMode === 'count' ? count : undefined,
          };
    onSubmit({ title: title.trim(), note: note.trim(), recurrence });
  }

  const selectClass =
    'bg-card border-border text-caption mt-1 h-9 w-full rounded-[5px] border px-2 outline-none';

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>블록 설정</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={handleSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="블록 이름"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 1부 세트"
                hint="비워두면 트랙 제목이 대신 표시됩니다."
              />
              <Textarea
                label="메모"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="선택"
                rows={3}
              />

              <Divider className="my-1" />

              <div>
                <label className="text-xs font-semibold" htmlFor="recurrence-freq">
                  반복 주기
                </label>
                <select
                  id="recurrence-freq"
                  value={freq}
                  onChange={(e) =>
                    setFreq(e.target.value as ScheduleBlockRecurrenceRequest['freq'])
                  }
                  className={selectClass}
                >
                  {RECURRENCE_FREQ_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {freq !== 'NONE' && (
                <>
                  <Input
                    label="반복 간격"
                    hint={
                      freq === 'DAILY'
                        ? '예: 2 → 2일마다'
                        : freq === 'WEEKLY'
                          ? '예: 2 → 2주마다'
                          : '예: 1 → 격주(2주)마다'
                    }
                    type="number"
                    min={1}
                    value={interval}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                  />
                  <div className="gap-s-3 flex items-center">
                    <label className="gap-s-1 flex items-center text-xs">
                      <input
                        type="radio"
                        name="recurrence-end-mode"
                        checked={endMode === 'until'}
                        onChange={() => setEndMode('until')}
                      />
                      종료일까지
                    </label>
                    <label className="gap-s-1 flex items-center text-xs">
                      <input
                        type="radio"
                        name="recurrence-end-mode"
                        checked={endMode === 'count'}
                        onChange={() => setEndMode('count')}
                      />
                      반복 횟수
                    </label>
                  </div>
                  {endMode === 'until' ? (
                    <Input
                      label="종료일"
                      type="date"
                      value={until}
                      onChange={(e) => setUntil(e.target.value)}
                    />
                  ) : (
                    <Input
                      label="반복 횟수"
                      type="number"
                      min={1}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                    />
                  )}
                </>
              )}
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter>
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button type="submit" variant="primary" disabled={isPending}>
              저장
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

export function SetlistScheduleBoard({
  setlistId,
  tracks,
}: {
  setlistId: string;
  tracks: SetlistTrackResponse[];
}) {
  const toast = useToast();
  const { data: boards, isPending } = useScheduleBoards(setlistId);
  const createBoard = useCreateScheduleBoard(setlistId);
  const updateBoard = useUpdateScheduleBoard(setlistId);
  const deleteBoard = useDeleteScheduleBoard(setlistId);
  const upsertBlock = useUpsertScheduleBlock(setlistId);
  const deleteBlock = useDeleteScheduleBlock(setlistId);
  const setPin = useSetScheduleBlockPin(setlistId);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [boardModal, setBoardModal] = useState<BoardModalState>(null);
  const [pendingDeleteBoard, setPendingDeleteBoard] = useState(false);
  const [recurrenceBlock, setRecurrenceBlock] = useState<ScheduleBlockResponse | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  // 시안 목록이 처음 로드되거나, 활성 시안이 삭제됐을 때 첫 시안을 자동 선택.
  useEffect(() => {
    if (!boards) return;
    if (activeBoardId && boards.some((b) => b.boardId === activeBoardId)) return;
    setActiveBoardId(boards[0]?.boardId ?? null);
  }, [boards, activeBoardId]);

  const activeBoard = boards?.find((b) => b.boardId === activeBoardId) ?? null;
  const hoveredBlock = activeBoard?.blocks.find((b) => b.blockId === hoveredBlockId) ?? null;

  const days = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    return enumerateDays(toLocalISODate(monday), toLocalISODate(friday));
  }, [weekOffset]);

  const rangeLabel =
    days.length > 0 ? `${days[0]!.slice(5)} ~ ${days[days.length - 1]!.slice(5)}` : '';

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.setlistTrackId, t])), [tracks]);

  const placedTrackIds = useMemo(
    () => new Set(activeBoard?.blocks.flatMap((b) => b.trackIds) ?? []),
    [activeBoard],
  );
  const unplacedTracks = tracks.filter((t) => !placedTrackIds.has(t.setlistTrackId));

  // 호버된 블록의 날짜+시간 기준으로 멤버 가능/불가능 분류 (임시 mock — 실제 가용 시간 API 연동 전).
  const hoverAvailability = useMemo(() => {
    if (!hoveredBlock) return null;
    const dateSlotKey = `${hoveredBlock.startDate}-${hoveredBlock.startSlot}`;
    const available: MockSessionMember[] = [];
    const unavailable: MockSessionMember[] = [];
    for (const m of MOCK_SESSION_MEMBERS) {
      (mockIsAvailable(m.memberId, dateSlotKey) ? available : unavailable).push(m);
    }
    return { available, unavailable, dateSlotKey };
  }, [hoveredBlock]);

  function handleBoardFormSubmit(body: ScheduleBoardCreateRequest) {
    if (boardModal?.mode === 'edit') {
      updateBoard.mutate(
        { boardId: boardModal.board.boardId, body },
        {
          onSuccess: () => {
            toast.success('시안 설정을 저장했습니다.');
            setBoardModal(null);
          },
          onError: () => toast.error('시안 설정 저장에 실패했습니다.'),
        },
      );
      return;
    }
    createBoard.mutate(body, {
      onSuccess: (board) => {
        setActiveBoardId(board.boardId);
        toast.success('시간표 시안을 만들었습니다.');
        setBoardModal(null);
      },
      onError: () => toast.error('시안 생성에 실패했습니다.'),
    });
  }

  function handleBlockSettingsSubmit(values: {
    title: string;
    note: string;
    recurrence: ScheduleBlockRecurrenceRequest;
  }) {
    if (!activeBoard || !recurrenceBlock) return;
    const boardId = activeBoard.boardId;
    const base = recurrenceBlock;

    upsertBlock.mutate(
      {
        boardId,
        blockId: base.blockId,
        body: {
          trackIds: base.trackIds,
          startDate: base.startDate,
          startSlot: base.startSlot,
          endDate: base.endDate,
          endSlot: base.endSlot,
          pinned: base.pinned,
          title: values.title || undefined,
          note: values.note || undefined,
          recurrence: values.recurrence,
        },
      },
      {
        onSuccess: () => {
          toast.success('블록 설정을 저장했습니다.');
          setRecurrenceBlock(null);
        },
        onError: () => toast.error('블록 설정 저장에 실패했습니다.'),
      },
    );
  }

  function handleDropOnCell(date: string, slot: number) {
    return (e: DragEvent) => {
      e.preventDefault();
      if (!activeBoard) return;

      const movingBlockId = e.dataTransfer.getData(BLOCK_DRAG_TYPE);
      if (movingBlockId) {
        const block = activeBoard.blocks.find((b) => b.blockId === movingBlockId);
        if (!block || block.pinned) return;
        const span = spanOf(block);
        upsertBlock.mutate({
          boardId: activeBoard.boardId,
          blockId: movingBlockId,
          body: {
            trackIds: block.trackIds,
            startDate: date,
            startSlot: slot,
            endDate: date,
            endSlot: slot + span - 1,
            pinned: block.pinned,
            title: block.title,
          },
        });
        return;
      }

      const trackId = e.dataTransfer.getData(TRACK_DRAG_TYPE);
      if (trackId) {
        const track = trackById.get(trackId);
        if (!track) return;
        const span = durationSlotsOf(track);
        upsertBlock.mutate({
          boardId: activeBoard.boardId,
          blockId: crypto.randomUUID(),
          body: {
            trackIds: [trackId],
            startDate: date,
            startSlot: slot,
            endDate: date,
            endSlot: slot + span - 1,
            pinned: false,
          },
        });
      }
    };
  }

  return (
    <div className="flex h-full min-w-0">
      {/* 세션 멤버 목록 — 블록 호버 시 가능/불가능으로 분류(임시 mock, 실제 가용 시간 API 연동 전). */}
      <div className="border-border bg-surface flex w-64 shrink-0 flex-col overflow-y-auto border-r">
        <div className="text-foreground-muted text-micro border-border border-b px-3 py-2 font-bold tracking-wider uppercase">
          세션 멤버
        </div>
        {hoverAvailability ? (
          <div className="gap-s-4 flex flex-col px-3 py-3">
            <div>
              <p className="text-success gap-s-1 mb-s-2 flex items-center text-sm font-bold">
                <Check className="h-4 w-4" /> 가능 ({hoverAvailability.available.length}명)
              </p>
              <div className="gap-s-2 flex flex-col">
                {hoverAvailability.available.map((m) => (
                  <MemberRow key={m.memberId} member={m} tone="available" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-danger gap-s-1 mb-s-2 flex items-center text-sm font-bold">
                <X className="h-4 w-4" /> 불가 ({hoverAvailability.unavailable.length}명)
              </p>
              <div className="gap-s-2 flex flex-col">
                {hoverAvailability.unavailable.map((m) => (
                  <MemberRow
                    key={m.memberId}
                    member={m}
                    tone="unavailable"
                    reason={mockUnavailableReason(m.memberId, hoverAvailability.dateSlotKey)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="gap-s-2 flex flex-col px-3 py-3">
            {MOCK_SESSION_MEMBERS.map((m) => (
              <MemberRow key={m.memberId} member={m} tone="neutral" />
            ))}
            <p className="text-foreground-muted text-micro mt-s-2">
              블록에 마우스를 올리면 가능 여부를 볼 수 있습니다.
            </p>
          </div>
        )}
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* 시안 전환/생성/설정/삭제 */}
        <div className="border-border gap-s-2 flex shrink-0 items-center border-b px-4 py-3">
          {boards && boards.length > 0 ? (
            <select
              value={activeBoardId ?? ''}
              onChange={(e) => setActiveBoardId(e.target.value)}
              aria-label="시간표 시안 선택"
              className="bg-card border-border text-caption h-8 min-w-0 flex-1 rounded-[5px] border px-2 outline-none"
            >
              {boards.map((b) => (
                <option key={b.boardId} value={b.boardId}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-foreground-muted text-caption flex-1">아직 시안이 없습니다.</p>
          )}

          {activeBoard && (
            <>
              <button
                type="button"
                onClick={() => setBoardModal({ mode: 'edit', board: activeBoard })}
                aria-label="시안 설정"
                className="text-foreground-muted hover:text-foreground shrink-0 rounded p-1 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteBoard(true)}
                aria-label="시안 삭제"
                className="text-foreground-muted hover:text-danger shrink-0 rounded p-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 rounded-[5px]"
            onClick={() => setBoardModal({ mode: 'create' })}
          >
            <Plus className="h-4 w-4" /> 새 시안
          </Button>
        </div>

        {!isPending && boards && boards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-foreground-muted text-sm">
              시간표 시안을 만들어 트랙을 배치해 보세요.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setBoardModal({ mode: 'create' })}
            >
              <Plus className="h-4 w-4" /> 새 시안 만들기
            </Button>
          </div>
        ) : (
          activeBoard && (
            <>
              {/* 미배치 트랙 — 그리드로 드래그해서 배치 */}
              {unplacedTracks.length > 0 && (
                <div className="border-border gap-s-1 flex shrink-0 flex-wrap border-b px-4 py-2">
                  {unplacedTracks.map((track) => {
                    const tone = songTone(track.setlistTrackId, 0);
                    return (
                      <span
                        key={track.setlistTrackId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(TRACK_DRAG_TYPE, track.setlistTrackId);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className={cn(
                          'cursor-grab truncate rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold active:cursor-grabbing',
                          tone.softBg,
                          tone.softBorder,
                          tone.text,
                        )}
                        title={track.title}
                      >
                        {track.title}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-2">
                <p className="text-foreground text-sm font-semibold">합주 시간표</p>
                <div className="gap-s-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => w - 1)}
                    aria-label="이전 주"
                    className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-foreground-muted text-caption min-w-[84px] text-center font-mono">
                    {rangeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => w + 1)}
                    aria-label="다음 주"
                    className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 px-4 py-3">
                <WeeklyScheduleGrid
                  days={days}
                  slotStart={SLOT_START}
                  slotEnd={SLOT_END}
                  className="h-full"
                  fillWidth
                  onCellDragOver={() => (e) => e.preventDefault()}
                  onCellDrop={handleDropOnCell}
                  overlay={activeBoard.blocks.map((block) => {
                    const dIdx = days.indexOf(block.startDate);
                    if (dIdx === -1) return null;
                    const trackTitles = block.trackIds
                      .map((id) => trackById.get(id)?.title)
                      .filter(Boolean)
                      .join(', ');
                    const tone = songTone(block.trackIds[0] ?? block.blockId, 0);
                    return (
                      <div
                        key={block.blockId}
                        draggable={!block.pinned}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(BLOCK_DRAG_TYPE, block.blockId);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onMouseEnter={() => setHoveredBlockId(block.blockId)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                        className={cn(
                          'm-px flex flex-col overflow-hidden rounded-sm border px-1.5 py-1 text-left',
                          tone.softBg,
                          tone.softBorder,
                          !block.pinned && 'cursor-grab active:cursor-grabbing',
                        )}
                        style={{
                          gridRow: `${block.startSlot - SLOT_START + 2} / span ${spanOf(block)}`,
                          gridColumn: dIdx + 2,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={cn('truncate text-[11px] font-semibold', tone.text)}>
                            {block.title || trackTitles || '(빈 블록)'}
                          </p>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setRecurrenceBlock(block)}
                              aria-label="블록 설정"
                              className={cn(
                                'rounded p-0.5',
                                block.recurrence.freq !== 'NONE' || block.title || block.note
                                  ? 'text-foreground'
                                  : 'text-foreground-muted hover:text-foreground',
                              )}
                            >
                              <Repeat className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPin.mutate({
                                  boardId: activeBoard.boardId,
                                  blockId: block.blockId,
                                  pinned: !block.pinned,
                                })
                              }
                              aria-label={block.pinned ? '고정 해제' : '고정'}
                              className="text-foreground-muted hover:text-foreground rounded p-0.5"
                            >
                              {block.pinned ? (
                                <Pin className="h-3 w-3" />
                              ) : (
                                <PinOff className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteBlock.mutate({
                                  boardId: activeBoard.boardId,
                                  blockId: block.blockId,
                                })
                              }
                              aria-label="블록 삭제"
                              className="text-foreground-muted hover:text-danger rounded p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-foreground-muted truncate text-[10px]">
                          {slotToTime(block.startSlot)}~{slotToTime(block.endSlot + 1)}
                        </p>
                      </div>
                    );
                  })}
                />
              </div>
            </>
          )
        )}
      </div>

      <ScheduleBoardFormModal
        open={boardModal !== null}
        mode={boardModal?.mode ?? 'create'}
        initial={boardModal?.mode === 'edit' ? boardModal.board : null}
        onOpenChange={(open) => {
          if (!open) setBoardModal(null);
        }}
        onSubmit={handleBoardFormSubmit}
        isPending={createBoard.isPending || updateBoard.isPending}
      />

      <BlockSettingsModal
        open={recurrenceBlock !== null}
        block={recurrenceBlock}
        onOpenChange={(open) => {
          if (!open) setRecurrenceBlock(null);
        }}
        onSubmit={handleBlockSettingsSubmit}
        isPending={upsertBlock.isPending}
      />

      <ConfirmDialog
        open={pendingDeleteBoard}
        onOpenChange={setPendingDeleteBoard}
        title="시안 삭제"
        description="이 시간표 시안을 정말 삭제하시겠습니까? 배치된 블록도 함께 사라집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!activeBoard) return;
          deleteBoard.mutate(activeBoard.boardId, {
            onError: () => toast.error('시안 삭제에 실패했습니다.'),
          });
        }}
      />
    </div>
  );
}
