'use client';

import { Settings2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { useBoardStore } from '../store/boardStore';
import { DEFAULT_BOARD_CONSTRAINTS, type ScheduleBoardConstraints } from '../types';
import { slotToTime } from '../utils';

/** Task 13 — Working Hours UI. 좌측 상단 토글로 펼침. */
export function WorkingHoursPanel({ boardId }: { boardId: string }) {
  const board = useBoardStore((s) => s.boards[boardId]);
  const setConstraints = useBoardStore((s) => s.setConstraints);
  const [open, setOpen] = useState(false);

  if (!board) return null;
  const c = board.constraints ?? DEFAULT_BOARD_CONSTRAINTS;

  const update = (patch: Partial<ScheduleBoardConstraints>) => {
    setConstraints(boardId, { ...c, ...patch });
  };

  return (
    <div className="bg-card border-border rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="px-s-3 py-s-2 gap-s-2 flex w-full items-center text-left"
      >
        <Settings2 className="h-4 w-4" />
        <span className="text-caption flex-1 font-bold">Working Hours</span>
        <span className="text-foreground-muted text-micro tabular-nums">
          {slotToTime(c.workingHoursStart)}~{slotToTime(c.workingHoursEnd)}
          {c.excludeLateNight && ' · 심야 배제'}
        </span>
      </button>
      {open && (
        <div className="border-border px-s-3 py-s-3 gap-s-3 flex flex-col border-t">
          <label className="gap-s-2 flex items-center">
            <span className="text-foreground-muted text-micro w-20 font-bold uppercase">시작</span>
            <input
              type="range"
              min={0}
              max={c.workingHoursEnd - 2}
              value={c.workingHoursStart}
              onChange={(e) => update({ workingHoursStart: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-foreground text-caption w-12 text-right font-mono tabular-nums">
              {slotToTime(c.workingHoursStart)}
            </span>
          </label>
          <label className="gap-s-2 flex items-center">
            <span className="text-foreground-muted text-micro w-20 font-bold uppercase">끝</span>
            <input
              type="range"
              min={c.workingHoursStart + 2}
              max={48}
              value={c.workingHoursEnd}
              onChange={(e) => update({ workingHoursEnd: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-foreground text-caption w-12 text-right font-mono tabular-nums">
              {slotToTime(c.workingHoursEnd)}
            </span>
          </label>
          <label className="gap-s-2 flex items-center">
            <input
              type="checkbox"
              checked={c.excludeLateNight}
              onChange={(e) => update({ excludeLateNight: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-caption">22:00 이후 배치 금지 (심야 배제)</span>
          </label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConstraints(boardId, DEFAULT_BOARD_CONSTRAINTS)}
            className={cn('self-start', 'text-foreground-muted')}
          >
            기본값 복원
          </Button>
        </div>
      )}
    </div>
  );
}
