'use client';

import { CheckCircle2, Download, GripVertical, Lock, RotateCcw } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { useScheduleExport } from '../hooks/useScheduleExport';
import { useBoardStore } from '../store/boardStore';
import { useTimetableStore } from '../store/timetableStore';
import type { ScheduleBlock } from '../types';
import { DEFAULT_BOARD_CONSTRAINTS } from '../types';
import { autoRescheduleAfterMove } from '../utils/autoReschedule';
import { dayOfWeek, slotToTime } from '../utils';

import { songTone } from './palette';
import { ScheduleBlockPanel } from './ScheduleBlockPanel.client';
import { WorkingHoursPanel } from './WorkingHoursPanel.client';

const DRAG_MIME = 'application/x-bandage-block';

interface SongLite {
  id: string;
  title: string;
  artist?: string | null;
}

interface Props {
  boardId: string;
  /** Mon~Sun 7일 또는 단일 일자(day unit). */
  days: string[];
  /** 합주 블록 풀 — 확정 곡. */
  songPool: SongLite[];
  /** 기본 블록 길이 (슬롯 단위). 30분 단위 스냅. */
  defaultDurationSlots?: number;
}

const RANGE_PRESETS = {
  '9-22': { start: 18, end: 44, label: '09-22' },
  '24h': { start: 0, end: 48, label: '24h' },
} as const;
type RangePreset = keyof typeof RANGE_PRESETS;

interface DragData {
  kind: 'pool' | 'block';
  songId: string;
  blockId?: string;
  durationSlots?: number;
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const SLOT_HEIGHT = 22; // px — 단위 반 시간 셀 높이.
const TIME_COL_WIDTH = 56;

export function ScheduleBoardEditor({ boardId, days, songPool, defaultDurationSlots = 4 }: Props) {
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
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [rangePreset, setRangePreset] = useState<RangePreset>('9-22');
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

  const slotCount = slotEnd - slotStart;
  const slots = Array.from({ length: slotCount }, (_, i) => slotStart + i);

  const onPoolDragStart = (song: SongLite) => (e: DragEvent) => {
    const data: DragData = {
      kind: 'pool',
      songId: song.id,
      durationSlots: defaultDurationSlots,
    };
    dragRef.current = data;
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    setDragging(true);
  };

  const onBlockDragStart = (block: ScheduleBlock) => (e: DragEvent) => {
    const data: DragData = {
      kind: 'block',
      songId: block.songId,
      blockId: block.blockId,
      durationSlots: block.durationSlots,
    };
    dragRef.current = data;
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true);
  };

  const onDragEnd = () => {
    dragRef.current = null;
    setHoverSlot(null);
    setDragging(false);
  };

  const onCellDragOver = (date: string, slot: number) => (e: DragEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = dragRef.current.kind === 'block' ? 'move' : 'copy';
    setHoverSlot({ date, slot });
  };

  const onCellDrop = (date: string, slot: number) => (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME);
    const data: DragData | null = raw ? JSON.parse(raw) : dragRef.current;
    dragRef.current = null;
    setHoverSlot(null);
    setDragging(false);
    if (!data) return;
    if (data.kind === 'block' && data.blockId) {
      const cur = board.blocks.find((b) => b.blockId === data.blockId);
      if (!cur) return;
      if (cur.pinned) return;
      const nextBlocks = board.blocks.map((b) =>
        b.blockId === data.blockId ? { ...b, date, startSlot: slot } : b,
      );
      const constraints = board.constraints ?? DEFAULT_BOARD_CONSTRAINTS;
      const datesPool = Array.from(new Set(board.blocks.map((b) => b.date).concat(date))).sort();
      const reflowed = autoRescheduleAfterMove({
        blocks: nextBlocks,
        anchorBlockId: data.blockId,
        constraints,
        availableDates: datesPool,
      });
      if (!reflowed) {
        toast.error('Working Hours 또는 잠금 충돌로 재배치 불가.');
        return;
      }
      setUndoSnapshot(board.blocks);
      replaceBlocks(boardId, reflowed);
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

  // 그리드 컬럼 너비 — 셀 단위 동일 비율.
  const gridStyle = {
    gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${days.length}, minmax(80px, 1fr))`,
    gridTemplateRows: `36px repeat(${slotCount}, ${SLOT_HEIGHT}px)`,
  } as const;

  return (
    <div className="gap-s-3 flex h-full overflow-hidden">
      <div className="gap-s-3 flex h-full min-w-0 flex-1 flex-col">
        <div className="gap-s-2 flex flex-wrap items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            disabled={exportApi.exporting || board.blocks.length === 0}
            onClick={() => {
              const stamp = new Date().toISOString().slice(0, 10);
              exportApi.exportJpeg(`${board.name}_${stamp}`);
            }}
          >
            {exportApi.exporting ? <Spinner /> : <Download className="h-4 w-4" />}
            JPEG 저장
          </Button>
          {board.confirmed ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDialog('unconfirm')}
              className="text-success"
            >
              <RotateCcw className="h-4 w-4" /> 확정 해제
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setConfirmDialog('confirm')}
              disabled={board.blocks.length === 0}
              className="bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> 이 시안으로 확정
            </Button>
          )}
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
                  onClick={() => setRangePreset(p)}
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

        <div
          ref={exportApi.ref}
          className="border-border bg-card flex-1 overflow-auto rounded-md border"
        >
          <div className="grid min-w-fit" style={gridStyle}>
            {/* 좌상단 코너 */}
            <div
              className="bg-surface border-border sticky top-0 left-0 z-30 border-r border-b"
              style={{ gridRow: 1, gridColumn: 1 }}
            />

            {/* 날짜 헤더 (col=2..) */}
            {days.map((d, i) => {
              const dow = dayOfWeek(d);
              const isWeekend = dow === 0 || dow === 6;
              return (
                <div
                  key={`h-${d}`}
                  className={cn(
                    'bg-surface border-border sticky top-0 z-20 border-b px-2 py-1 text-center font-mono',
                    isWeekend && 'text-amber',
                  )}
                  style={{ gridRow: 1, gridColumn: i + 2 }}
                >
                  <div className="text-micro font-bold">{DOW_LABELS[dow]}</div>
                  <div className="text-caption font-bold">{d.slice(5)}</div>
                </div>
              );
            })}

            {/* 시간 라벨 (row=2.., col=1) — 짝수 슬롯(정시) 만 라벨. */}
            {slots.map((s, idx) => (
              <div
                key={`tl-${s}`}
                className={cn(
                  'bg-surface border-border sticky left-0 z-10 border-r px-1 text-right font-mono',
                  idx === 0 && 'border-t-0',
                )}
                style={{
                  gridRow: idx + 2,
                  gridColumn: 1,
                  lineHeight: `${SLOT_HEIGHT}px`,
                }}
              >
                {s % 2 === 0 ? (
                  <span className="text-foreground-muted text-micro">{slotToTime(s)}</span>
                ) : null}
              </div>
            ))}

            {/* 드롭 셀들 (row=2.., col=2..) */}
            {slots.map((s, sIdx) =>
              days.map((d, dIdx) => {
                const isHover = hoverSlot && hoverSlot.date === d && hoverSlot.slot === s;
                const isHourBoundary = s % 2 === 0;
                return (
                  <div
                    key={`c-${d}-${s}`}
                    onDragOver={onCellDragOver(d, s)}
                    onDragLeave={() => setHoverSlot(null)}
                    onDrop={onCellDrop(d, s)}
                    className={cn(
                      'border-border border-r transition-colors',
                      isHourBoundary && 'border-t',
                      dragging && 'bg-accent-soft',
                      isHover && 'bg-accent-dim ring-accent ring-1',
                    )}
                    style={{ gridRow: sIdx + 2, gridColumn: dIdx + 2 }}
                  />
                );
              }),
            )}

            {/* 블록 — 그리드 row span 으로 배치. */}
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
                        'm-0.5 cursor-grab overflow-hidden rounded px-1 py-0.5 text-left text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] active:cursor-grabbing',
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
          </div>
        </div>
      </div>

      {/* 우측 사이드 — 합주 블록 풀. 시간표 시안 카드와 동일 비중. */}
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
              return (
                <button
                  key={song.id}
                  draggable
                  onDragStart={onPoolDragStart(song)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    'gap-s-2 flex items-center rounded-md px-2 py-1.5 text-left text-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]',
                    tone.bg,
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
              onClose={() => setSelectedBlockId(null)}
            />
          );
        })()}
    </div>
  );
}
