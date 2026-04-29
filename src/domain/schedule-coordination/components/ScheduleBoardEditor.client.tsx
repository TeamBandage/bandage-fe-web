'use client';

import {
  CheckCircle2,
  ChevronDown,
  GripVertical,
  Image as ImageIcon,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { useScheduleExport } from '../hooks/useScheduleExport';
import { useBoardStore } from '../store/boardStore';
import { useScheduleStore } from '../store/scheduleStore';
import { useScheduleViewStore } from '../store/scheduleViewStore';
import { useTimetableStore } from '../store/timetableStore';
import { buildCoverageHeatmap } from '../utils/coverageHeatmap';
import type { ScheduleBlock } from '../types';
import { DEFAULT_BOARD_CONSTRAINTS } from '../types';
import { autoRescheduleAfterMove, computeValidDropSlots } from '../utils/autoReschedule';
import { slotToTime, toLocalISODate } from '../utils';

import { songTone } from './palette';
import { RANGE_PRESETS, type RangePreset, DEFAULT_RANGE_PRESET } from './rangePresets';
import { ScheduleBlockPanel } from './ScheduleBlockPanel.client';
import { DateRangeNav } from './ViewUnitToggle.client';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid.client';
import { WorkingHoursPanel } from './WorkingHoursPanel.client';

const DRAG_MIME = 'application/x-bandage-block';

interface SongLite {
  id: string;
  title: string;
  artist?: string | null;
}

interface Props {
  boardId: string;
  /** 보이는 일자 컬럼들. */
  days: string[];
  /** 회의 가용 일자에 속하는지. */
  isInWindow?: (date: string) => boolean;
  rangeLabel: string;
  compact: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  /** 합주 블록 풀 — 확정 곡. */
  songPool: SongLite[];
  /** songId → 참여 멤버 userId. 곡별 가용시간 모드용 (Task 18). */
  songParticipantsMap?: Record<string, string[]>;
  defaultDurationSlots?: number;
}

interface DragData {
  kind: 'pool' | 'block';
  songId: string;
  blockId?: string;
  durationSlots?: number;
}

export function ScheduleBoardEditor({
  boardId,
  days,
  isInWindow,
  rangeLabel,
  compact,
  onPrev,
  onNext,
  onToday,
  canPrev,
  canNext,
  songPool,
  songParticipantsMap,
  defaultDurationSlots = 2,
}: Props) {
  const board = useBoardStore((s) => s.boards[boardId]);
  const upsertBlock = useBoardStore((s) => s.upsertBlock);
  const replaceBlocks = useBoardStore((s) => s.replaceBlocks);
  const confirmBoard = useBoardStore((s) => s.confirmBoard);
  const unconfirmAll = useBoardStore((s) => s.unconfirmAll);
  const setTimetableConfirmed = useTimetableStore((s) => s.setConfirmed);
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState<'confirm' | 'unconfirm' | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<ScheduleBlock[] | null>(null);

  const dragRef = useRef<DragData | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ date: string; slot: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [validDropSet, setValidDropSet] = useState<Set<string>>(() => new Set());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const meetingIdForRange = board?.meetingId ?? '';
  const rangePreset = useScheduleViewStore(
    (s) => s.rangePresetByMeeting[meetingIdForRange] ?? DEFAULT_RANGE_PRESET,
  );
  const setRangePreset = useScheduleViewStore((s) => s.setRangePreset);
  const focusedSongId = useScheduleViewStore(
    (s) => s.focusedSongIdByMeeting[meetingIdForRange] ?? null,
  );
  const toggleFocusedSongId = useScheduleViewStore((s) => s.toggleFocusedSongId);

  /** 곡별 가용시간 모드 — 모든 멤버 일정. focusedSongId 있을 때만 계산. */
  const allMemberSchedules = useScheduleStore((s) => s.schedules);
  const availabilityHeat = useMemo(() => {
    if (!focusedSongId || !meetingIdForRange) return null;
    const userIds = songParticipantsMap?.[focusedSongId];
    if (!userIds || userIds.length === 0) return null;
    const list = userIds
      .map((uid) => allMemberSchedules[`${meetingIdForRange}__${uid}`])
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    if (list.length === 0) return null;
    return buildCoverageHeatmap({
      memberSchedules: list,
      allDays: days,
      slotFrom: RANGE_PRESETS[rangePreset].start,
      slotTo: RANGE_PRESETS[rangePreset].end,
      scope: 'ALL',
    });
  }, [
    focusedSongId,
    meetingIdForRange,
    songParticipantsMap,
    allMemberSchedules,
    days,
    rangePreset,
  ]);
  const heatTotal = focusedSongId ? (songParticipantsMap?.[focusedSongId]?.length ?? 0) : 0;
  const exportApi = useScheduleExport<HTMLDivElement>();
  const slotStart = RANGE_PRESETS[rangePreset].start;
  const slotEnd = RANGE_PRESETS[rangePreset].end;

  const blocksByDate = useMemo(() => {
    const m: Record<string, ScheduleBlock[]> = {};
    if (!board) return m;
    for (const b of board.blocks) {
      (m[b.date] ??= []).push(b);
    }
    return m;
  }, [board]);

  const songMap = useMemo(() => {
    const m = new Map<string, SongLite>();
    for (const s of songPool) m.set(s.id, s);
    return m;
  }, [songPool]);

  if (!board) {
    return <p className="text-foreground-muted text-caption">시안을 찾을 수 없습니다.</p>;
  }

  const startDragWith = (data: DragData) => {
    dragRef.current = data;
    setDragging(true);
    const dur = data.durationSlots ?? defaultDurationSlots;
    const validInWindow = days.filter((d) => isInWindow?.(d) ?? true);
    const set = computeValidDropSlots({
      blocks: board.blocks,
      excludeBlockId: data.blockId,
      durationSlots: dur,
      constraints: board.constraints ?? DEFAULT_BOARD_CONSTRAINTS,
      dates: validInWindow,
    });
    setValidDropSet(set);
  };

  const setBlockDragImage = (e: DragEvent) => {
    // 기본 drag image 는 element 의 absolute/grid 위치 + 형제 stacking 까지 포함되어
    // "다른 블록 텍스트가 함께 따라옴" 현상을 유발. 현재 타깃만 clone 해서 드래그 이미지로 사용.
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.9';
    ghost.style.transform = 'none';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
    // dragend 후 정리.
    setTimeout(() => ghost.remove(), 0);
  };

  const onPoolDragStart = (song: SongLite) => (e: DragEvent) => {
    const data: DragData = {
      kind: 'pool',
      songId: song.id,
      durationSlots: defaultDurationSlots,
    };
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    setBlockDragImage(e);
    startDragWith(data);
  };

  const onBlockDragStart = (block: ScheduleBlock) => (e: DragEvent) => {
    const data: DragData = {
      kind: 'block',
      songId: block.songId,
      blockId: block.blockId,
      durationSlots: block.durationSlots,
    };
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    setBlockDragImage(e);
    startDragWith(data);
  };

  /** 블록 변경(이동/길이/메모 등) 적용 — auto-reschedule + undo snapshot 처리. */
  const applyBlockUpdate = (updated: ScheduleBlock) => {
    const cur = board.blocks.find((b) => b.blockId === updated.blockId);
    if (!cur) return;
    const nextBlocks = board.blocks.map((b) => (b.blockId === updated.blockId ? updated : b));
    const constraints = board.constraints ?? DEFAULT_BOARD_CONSTRAINTS;
    const datesPool = Array.from(
      new Set(board.blocks.map((b) => b.date).concat(updated.date)),
    ).sort();
    const reflowed = autoRescheduleAfterMove({
      blocks: nextBlocks,
      anchorBlockId: updated.blockId,
      constraints,
      availableDates: datesPool,
    });
    if (!reflowed) {
      toast.error('Working Hours 또는 잠금 충돌로 재배치 불가.');
      return;
    }
    // 변경 전후 동일하면(메모만 수정 등) 스냅샷 생략.
    const movedSomeOther = reflowed.some((r) => {
      if (r.blockId === updated.blockId) return false;
      const before = board.blocks.find((b) => b.blockId === r.blockId);
      return !before || before.date !== r.date || before.startSlot !== r.startSlot;
    });
    if (movedSomeOther) setUndoSnapshot(board.blocks);
    replaceBlocks(boardId, reflowed);
  };

  const onDragEnd = () => {
    dragRef.current = null;
    setHoverSlot(null);
    setDragging(false);
    setValidDropSet(new Set());
  };

  const onCellDragOver = (date: string, slot: number) => (e: DragEvent) => {
    if (!dragRef.current) return;
    if (!validDropSet.has(`${date}__${slot}`)) {
      // 유효하지 않은 셀 — drop 거부 (preventDefault 안 함).
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = dragRef.current.kind === 'block' ? 'move' : 'copy';
    setHoverSlot({ date, slot });
  };

  const onCellDrop = (date: string, slot: number) => (e: DragEvent) => {
    if (!validDropSet.has(`${date}__${slot}`)) return;
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME);
    const data: DragData | null = raw ? JSON.parse(raw) : dragRef.current;
    dragRef.current = null;
    setHoverSlot(null);
    setDragging(false);
    setValidDropSet(new Set());
    if (!data) return;
    if (data.kind === 'block' && data.blockId) {
      const cur = board.blocks.find((b) => b.blockId === data.blockId);
      if (!cur) return;
      if (cur.pinned) return;
      applyBlockUpdate({ ...cur, date, startSlot: slot });
      return;
    }
    const newBlock: ScheduleBlock = {
      blockId: `blk_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`,
      songId: data.songId,
      date,
      startSlot: slot,
      durationSlots: data.durationSlots ?? defaultDurationSlots,
      pinned: false,
      paletteIndex: board.blocks.length,
    };
    upsertBlock(boardId, newBlock);
  };

  const cellClassName = (date: string, slot: number, inWindow: boolean) => {
    if (!inWindow) return undefined;
    const isHover = hoverSlot && hoverSlot.date === date && hoverSlot.slot === slot;
    if (isHover) return 'bg-accent-dim ring-accent ring-1';
    // 드래그 중에는 실제 배치 가능한 셀만 옅게 강조.
    if (dragging && validDropSet.has(`${date}__${slot}`)) return 'bg-accent-soft';
    // 곡별 가용시간 모드 — 해당 곡 참여 멤버의 가용 비율로 옅은 초록 히트맵.
    if (availabilityHeat && heatTotal > 0) {
      const c = availabilityHeat.get(`${date}__${slot}`)?.size ?? 0;
      const r = c / heatTotal;
      if (r === 0) return undefined;
      if (r < 0.34) return 'bg-success/15';
      if (r < 0.67) return 'bg-success/30';
      if (r < 1) return 'bg-success/50';
      return 'bg-success/70';
    }
    return undefined;
  };

  const overlay = (
    <>
      {days.map((d, dIdx) => {
        const blocks = blocksByDate[d] ?? [];
        return blocks
          .filter((b) => b.startSlot >= slotStart && b.startSlot < slotEnd)
          .map((b) => {
            const tone = songTone(b.songId, board.paletteSeed);
            const rowStart = b.startSlot - slotStart + 2;
            const rowSpan = Math.min(b.durationSlots, slotEnd - b.startSlot);
            return (
              <button
                key={b.blockId}
                type="button"
                draggable={!b.pinned}
                onDragStart={onBlockDragStart(b)}
                onDragEnd={onDragEnd}
                onClick={() => setSelectedBlockId(b.blockId)}
                className={cn(
                  'm-0.5 cursor-grab overflow-hidden rounded px-1 py-0.5 text-left text-white shadow-sm ring-0 ring-white/0 transition-all duration-150 ease-out hover:scale-[1.02] hover:ring-2 hover:ring-white/40 hover:brightness-125 active:scale-[0.98] active:cursor-grabbing',
                  tone.bg,
                )}
                style={{
                  gridRow: `${rowStart} / span ${rowSpan}`,
                  gridColumn: dIdx + 2,
                }}
                title={`${songMap.get(b.songId)?.title ?? b.songId} ${slotToTime(b.startSlot)}~${slotToTime(b.startSlot + b.durationSlots)}`}
              >
                <div className="text-micro flex items-center gap-1 font-bold">
                  {b.pinned && <Lock className="h-3 w-3 shrink-0" />}
                  <span className="truncate">
                    {b.songTitleOverride ?? songMap.get(b.songId)?.title ?? '곡'}
                  </span>
                </div>
                {rowSpan >= 3 && (
                  <div className="text-micro mt-0.5 font-mono opacity-80">
                    {slotToTime(b.startSlot)}~{slotToTime(b.startSlot + b.durationSlots)}
                  </div>
                )}
              </button>
            );
          });
      })}
    </>
  );

  return (
    <div className="gap-s-3 flex h-full overflow-hidden">
      <div className="gap-s-3 flex h-full min-w-0 flex-1 flex-col">
        {/* 상단: 현재 주차 라벨 (메인) + 보조 액션. */}
        <div className="gap-s-3 flex flex-wrap items-center justify-between">
          <DateRangeNav
            rangeLabel={rangeLabel}
            compact={compact}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
            canPrev={canPrev}
            canNext={canNext}
          />
          <div className="gap-s-2 flex items-center">
            <div
              role="radiogroup"
              aria-label="시간 범위"
              className="bg-card border-border inline-flex rounded-md border p-0.5"
            >
              {(Object.keys(RANGE_PRESETS) as RangePreset[]).map((p) => {
                const active = p === rangePreset;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRangePreset(meetingIdForRange, p)}
                    className={cn(
                      'text-micro px-s-2 rounded py-1 font-bold transition-colors',
                      active
                        ? 'bg-accent text-bg shadow-sm'
                        : 'text-foreground-muted hover:text-foreground',
                    )}
                  >
                    {RANGE_PRESETS[p].label}
                  </button>
                );
              })}
            </div>
            <ExportMenu
              boardName={board.name}
              disabled={board.blocks.length === 0}
              exporting={exportApi.exporting}
              onExport={(fmt) => {
                const stamp = toLocalISODate(new Date());
                exportApi.exportImage(`${board.name}_${stamp}`, fmt);
              }}
            />
            {board.confirmed ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDialog('unconfirm')}
                className="text-success"
              >
                <RotateCcw className="h-4 w-4" /> 해제
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setConfirmDialog('confirm')}
                disabled={board.blocks.length === 0}
                className="bg-success hover:bg-success/90 text-white"
              >
                <CheckCircle2 className="h-4 w-4" /> 확정
              </Button>
            )}
          </div>
        </div>

        <WorkingHoursPanel boardId={boardId} />

        {undoSnapshot && (
          <div className="bg-warn-dim border-warn px-s-3 py-s-2 gap-s-2 flex items-center rounded-md border">
            <span className="text-caption text-warn flex-1 font-bold">
              자동 재배치가 적용되었습니다.
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (undoSnapshot) {
                  replaceBlocks(boardId, undoSnapshot);
                  setUndoSnapshot(null);
                  toast.success('변경을 되돌렸습니다.');
                }
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> 되돌리기
            </Button>
            <button
              type="button"
              onClick={() => setUndoSnapshot(null)}
              className="text-foreground-muted hover:text-foreground text-micro"
              aria-label="알림 닫기"
            >
              닫기
            </button>
          </div>
        )}

        <WeeklyScheduleGrid
          days={days}
          slotStart={slotStart}
          slotEnd={slotEnd}
          isInWindow={isInWindow}
          onCellDragOver={onCellDragOver}
          onCellDragLeave={() => setHoverSlot(null)}
          onCellDrop={onCellDrop}
          cellClassName={cellClassName}
          gridRef={exportApi.ref}
          overlay={overlay}
        />
      </div>

      {/* 우측 사이드 — 합주 블록 풀. */}
      <aside className="bg-card border-border flex w-56 shrink-0 flex-col rounded-md border">
        <div className="border-border px-s-3 py-s-2 border-b">
          <div className="text-foreground-muted text-micro font-bold uppercase">
            합주 블록 풀 ({songPool.length})
          </div>
        </div>
        <div className="px-s-2 py-s-2 gap-s-1 flex flex-1 flex-col overflow-y-auto">
          {songPool.length === 0 ? (
            <p className="text-foreground-muted text-micro p-2">확정된 곡이 없습니다.</p>
          ) : (
            songPool.map((song) => {
              const tone = songTone(song.id, board.paletteSeed);
              const focused = focusedSongId === song.id;
              return (
                <button
                  key={song.id}
                  draggable
                  onDragStart={onPoolDragStart(song)}
                  onDragEnd={onDragEnd}
                  onClick={() => toggleFocusedSongId(meetingIdForRange, song.id)}
                  aria-pressed={focused}
                  title={
                    focused ? '클릭하여 일반 모드로' : '클릭하여 이 곡 참여 멤버 가용시간 보기'
                  }
                  className={cn(
                    'gap-s-2 flex items-center rounded-md px-2 py-1.5 text-left text-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]',
                    tone.bg,
                    focused && 'ring-accent ring-offset-card ring-2 ring-offset-2',
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <div className="min-w-0">
                    <div className="text-micro truncate font-bold">{song.title}</div>
                    {song.artist && (
                      <div className="text-micro truncate opacity-75">{song.artist}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDialog === 'confirm'}
        onOpenChange={(o) => !o && setConfirmDialog(null)}
        title="시간표 확정"
        description="이 시안을 최종 합주 시간표로 확정합니다. 같은 회의의 다른 시안 확정은 자동 해제됩니다."
        confirmLabel="확정"
        onConfirm={() => {
          confirmBoard(boardId);
          setTimetableConfirmed(board.meetingId, true);
          setConfirmDialog(null);
          toast.success('시간표가 확정되었습니다.');
        }}
      />
      <ConfirmDialog
        open={confirmDialog === 'unconfirm'}
        onOpenChange={(o) => !o && setConfirmDialog(null)}
        title="확정 해제"
        description="확정을 해제하면 회의 진행도 게이지가 입력 단계로 돌아갑니다."
        confirmLabel="확정 해제"
        tone="danger"
        onConfirm={() => {
          unconfirmAll(board.meetingId);
          setTimetableConfirmed(board.meetingId, false);
          setConfirmDialog(null);
          toast.success('확정이 해제되었습니다.');
        }}
      />

      {selectedBlockId &&
        (() => {
          const sel = board.blocks.find((b) => b.blockId === selectedBlockId);
          if (!sel) return null;
          return (
            <ScheduleBlockPanel
              boardId={boardId}
              block={sel}
              songTitle={songMap.get(sel.songId)?.title ?? '곡'}
              paletteSeed={board.paletteSeed}
              onSave={applyBlockUpdate}
              onClose={() => setSelectedBlockId(null)}
            />
          );
        })()}
    </div>
  );
}

function ExportMenu({
  boardName,
  disabled,
  exporting,
  onExport,
}: {
  boardName: string;
  disabled: boolean;
  exporting: boolean;
  onExport: (fmt: 'png' | 'jpeg') => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled || exporting}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${boardName} 이미지 저장`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {exporting ? <Spinner /> : <ImageIcon className="h-4 w-4" />}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="bg-surface border-border absolute right-0 z-40 mt-1 w-40 rounded-md border shadow-xl">
            <button
              type="button"
              onClick={() => {
                onExport('png');
                setOpen(false);
              }}
              className="text-caption hover:bg-card px-s-3 py-s-2 flex w-full items-center gap-2 font-bold"
            >
              PNG (무손실)
            </button>
            <button
              type="button"
              onClick={() => {
                onExport('jpeg');
                setOpen(false);
              }}
              className="text-caption text-foreground-muted hover:bg-card px-s-3 py-s-2 flex w-full items-center gap-2"
            >
              JPEG (저용량)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
