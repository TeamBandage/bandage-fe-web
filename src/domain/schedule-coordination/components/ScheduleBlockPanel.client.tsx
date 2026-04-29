'use client';

import { Lock, Trash2, Unlock, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

import { useBoardStore } from '../store/boardStore';
import type { ScheduleBlock } from '../types';
import { slotToTime } from '../utils';

import { songTone } from './palette';

interface Props {
  boardId: string;
  block: ScheduleBlock;
  songTitle: string;
  paletteSeed: number;
  /** 저장 — Editor 에서 auto-reschedule + undo snapshot 처리 후 store 갱신. */
  onSave: (updated: ScheduleBlock) => void;
  onClose: () => void;
}

export function ScheduleBlockPanel({
  boardId,
  block,
  songTitle,
  paletteSeed,
  onSave,
  onClose,
}: Props) {
  const removeBlock = useBoardStore((s) => s.removeBlock);
  const togglePin = useBoardStore((s) => s.togglePin);

  const [titleOverride, setTitleOverride] = useState(block.songTitleOverride ?? '');
  const [note, setNote] = useState(block.note ?? '');
  const [duration, setDuration] = useState(block.durationSlots);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitleOverride(block.songTitleOverride ?? '');
    setNote(block.note ?? '');
    setDuration(block.durationSlots);
  }, [block.blockId, block.songTitleOverride, block.note, block.durationSlots]);

  const tone = songTone(block.songId, paletteSeed);

  const save = () => {
    onSave({
      ...block,
      songTitleOverride: titleOverride.trim() || undefined,
      note: note.trim() || undefined,
      durationSlots: Math.max(1, Math.min(48 - block.startSlot, duration)),
    });
    onClose();
  };

  return (
    <div
      className="bg-bg/40 fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface border-border w-full max-w-md rounded-lg border p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-s-3 flex items-start justify-between">
          <div className="min-w-0">
            <div className={cn('text-micro font-bold uppercase', tone.text)}>합주 블록 상세</div>
            <h3 className="text-subtitle truncate font-bold">{songTitle}</h3>
            <p className="text-foreground-muted text-micro mt-0.5">
              {block.date} {slotToTime(block.startSlot)} ~{' '}
              {slotToTime(block.startSlot + block.durationSlots)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground rounded-md p-1"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="gap-s-3 flex flex-col">
          <Input
            label="표시 곡명 (옵션)"
            value={titleOverride}
            onChange={(e) => setTitleOverride(e.target.value)}
            placeholder={songTitle}
          />
          <label className="text-micro flex flex-col gap-1 font-bold">
            <span className="text-foreground-muted uppercase">메모</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="bg-surface border-border focus-visible:ring-accent text-caption rounded-md border px-3 py-2 focus-visible:ring-2 focus-visible:outline-none"
              placeholder="ex) 드럼 위주 / 보컬 합 맞추기"
            />
          </label>
          <label className="text-micro gap-s-2 flex items-center font-bold">
            <span className="text-foreground-muted uppercase">길이</span>
            <input
              type="range"
              min={1}
              max={Math.min(16, 48 - block.startSlot)}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-foreground tabular-nums">{duration * 30}분</span>
          </label>
          <div className="border-border bg-card px-s-3 py-s-2 gap-s-2 flex items-center justify-between rounded-md border">
            <div className="min-w-0">
              <div className="text-caption gap-s-1 flex items-center font-bold">
                {block.pinned ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
                자동 재배치 잠금
              </div>
              <p className="text-foreground-muted text-micro">
                Auto-rescheduling 시 이 블록은 이동되지 않습니다.
              </p>
            </div>
            <Button
              size="sm"
              variant={block.pinned ? 'primary' : 'accent-outline'}
              onClick={() => togglePin(boardId, block.blockId)}
            >
              {block.pinned ? '잠금 해제' : '잠금'}
            </Button>
          </div>
        </div>

        <div className="mt-s-4 gap-s-2 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> 삭제
          </Button>
          <div className="gap-s-2 flex">
            <Button variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" onClick={save}>
              저장
            </Button>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="블록 삭제"
          description="이 블록을 삭제할까요?"
          confirmLabel="삭제"
          tone="danger"
          onConfirm={() => {
            removeBlock(boardId, block.blockId);
            setConfirmDelete(false);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
