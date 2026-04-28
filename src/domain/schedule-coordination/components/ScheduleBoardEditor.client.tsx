'use client';

import { GripVertical, Lock } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';

import { cn } from '@/lib/cn';

import { useBoardStore } from '../store/boardStore';
import type { ScheduleBlock } from '../types';
import { slotToTime } from '../utils';

import { songTone } from './palette';
import { ScheduleBlockPanel } from './ScheduleBlockPanel.client';

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
  /** 슬롯 시작 / 끝 (24h=0~48 / 9-22=18~44). Task 7 토글이 결정. */
  slotStart: number;
  slotEnd: number;
  /** 기본 블록 길이 (슬롯 단위). 30분 단위 스냅. */
  defaultDurationSlots?: number;
}

interface DragData {
  kind: 'pool' | 'block';
  songId: string;
  blockId?: string;
  paletteIndex?: number;
  durationSlots?: number;
}

export function ScheduleBoardEditor({
  boardId,
  days,
  songPool,
  slotStart,
  slotEnd,
  defaultDurationSlots = 4,
}: Props) {
  const board = useBoardStore((s) => s.boards[boardId]);
  const upsertBlock = useBoardStore((s) => s.upsertBlock);

  const dragRef = useRef<DragData | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ date: string; slot: number } | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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
      upsertBlock(boardId, { ...cur, date, startSlot: slot });
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

      <div className="border-border bg-card flex-1 overflow-auto rounded-md border">
        <table className="text-micro w-full table-fixed border-collapse">
          <thead className="bg-surface sticky top-0 z-10">
            <tr>
              <th className="border-border w-20 border-r border-b px-1 py-1 text-left font-mono">
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
                  <td className="border-border bg-surface border-r px-1 py-1 font-mono">
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
