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
import { slotToTime } from '../utils';

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
  /** 시안 위에 띄울 일자 목록. ViewUnit 으로 슬라이스된 visibleDays 사용. */
  days: string[];
  /** 합주 블록 풀 — 확정 곡 (Task 4 자동 추천 / Task 12 mock). */
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
  paletteIndex?: number;
  durationSlots?: number;
}

export function ScheduleBoardEditor({ boardId, days, songPool, defaultDurationSlots = 4 }: Props) {
  const board = useBoardStore((s) => s.boards[boardId]);
  const upsertBlock = useBoardStore((s) => s.upsertBlock);
  const replaceBlocks = useBoardStore((s) => s.replaceBlocks);
  const confirmBoard = useBoardStore((s) => s.confirmBoard);
  const unconfirmAll = useBoardStore((s) => s.unconfirmAll);
  const setTimetableConfirmed = useTimetableStore((s) => s.setConfirmed);
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState<'confirm' | 'unconfirm' | null>(null);
  /** 변경 직전 스냅샷 — Undo 토스트용. */
  const [undoSnapshot, setUndoSnapshot] = useState<ScheduleBlock[] | null>(null);

  const dragRef = useRef<DragData | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ date: string; slot: number } | null>(null);
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
  };

  const onBlockDragStart = (block: ScheduleBlock) => (e: DragEvent) => {
    const data: DragData = {
      kind: 'block',
      songId: block.songId,
      blockId: block.blockId,
      paletteIndex: block.paletteIndex,
      durationSlots: block.durationSlots,
    };
    dragRef.current = data;
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
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

  return (
    <div className="gap-s-3 flex h-full flex-col">
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

      <div className="border-border bg-card px-s-3 py-s-2 rounded-md border">
        <div className="text-foreground-muted text-micro mb-s-2 font-bold uppercase">
          합주 블록 풀
        </div>
        <div className="gap-s-2 flex flex-wrap">
          {songPool.length === 0 ? (
            <p className="text-foreground-muted text-micro">확정된 곡이 없습니다.</p>
          ) : (
            songPool.map((song) => {
              const tone = songTone(song.id, board.paletteSeed);
              return (
                <button
                  key={song.id}
                  draggable
                  onDragStart={onPoolDragStart(song)}
                  className={cn(
                    'gap-s-1 flex items-center rounded-md border-2 px-2 py-1 text-left',
                    tone.dim,
                    tone.border,
                  )}
                >
                  <GripVertical className={cn('h-3 w-3', tone.text)} />
                  <div className="min-w-0">
                    <div className={cn('text-micro truncate font-bold', tone.text)}>
                      {song.title}
                    </div>
                    {song.artist && (
                      <div className="text-foreground-muted text-micro truncate">{song.artist}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        ref={exportApi.ref}
        className="border-border bg-card flex-1 overflow-auto rounded-md border"
      >
        <table
          className="text-micro border-collapse"
          style={{
            width: rangePreset === '24h' ? `${80 + (slotEnd - slotStart) * 32}px` : '100%',
            tableLayout: 'fixed',
          }}
        >
          <thead className="bg-surface sticky top-0 z-10">
            <tr>
              <th className="border-border bg-surface sticky left-0 z-20 w-20 border-r border-b px-1 py-1 text-left font-mono">
                일자
              </th>
              {slots.map((s) => (
                <th key={s} className="border-border w-8 border-b px-0 py-1 text-center font-mono">
                  {s % 2 === 0 ? slotToTime(s) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const blocks = blocksByDate[d] ?? [];
              const occupiedBy: Record<number, ScheduleBlock | undefined> = {};
              for (const b of blocks) {
                for (let i = 0; i < b.durationSlots; i++) {
                  occupiedBy[b.startSlot + i] = b;
                }
              }
              return (
                <tr key={d} className="border-border border-t">
                  <td className="border-border bg-surface sticky left-0 z-10 border-r px-1 py-1 font-mono">
                    {d.slice(5)}
                  </td>
                  {slots.map((s) => {
                    const occ = occupiedBy[s];
                    const isStart = occ && occ.startSlot === s;
                    const tone = occ ? songTone(occ.songId, board.paletteSeed) : null;
                    const isHover =
                      hoverSlot && hoverSlot.date === d && hoverSlot.slot === s && !occ;
                    return (
                      <td
                        key={s}
                        onDragOver={onCellDragOver(d, s)}
                        onDragLeave={() => setHoverSlot(null)}
                        onDrop={onCellDrop(d, s)}
                        className={cn(
                          'border-border h-7 border-r p-0 align-top',
                          !occ && 'hover:bg-bg/40',
                          isHover && 'bg-accent-dim',
                        )}
                      >
                        {isStart && occ && tone && (
                          <button
                            type="button"
                            draggable={!occ.pinned}
                            onDragStart={onBlockDragStart(occ)}
                            onClick={() => setSelectedBlockId(occ.blockId)}
                            className={cn(
                              'h-full cursor-grab rounded border-2 px-1 py-0.5 text-left',
                              tone.dim,
                              tone.border,
                            )}
                            style={{ width: `calc(${occ.durationSlots * 100}% - 1px)` }}
                            title={`${songMap.get(occ.songId)?.title ?? occ.songId} ${slotToTime(occ.startSlot)}~${slotToTime(occ.startSlot + occ.durationSlots)}`}
                          >
                            <div
                              className={cn(
                                'text-micro gap-s-1 flex items-center font-bold',
                                tone.text,
                              )}
                            >
                              {occ.pinned && <Lock className="h-3 w-3" />}
                              <span className="truncate">
                                {occ.songTitleOverride ?? songMap.get(occ.songId)?.title ?? '곡'}
                              </span>
                            </div>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
