'use client';

import { Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

import type { LockedSlot } from '../store/matrixLockStore';
import { slotToTime } from '../utils';

import { songTone } from './palette';

interface SongLite {
  id: string;
  title: string;
  artist?: string | null;
}

interface Props {
  lock: LockedSlot;
  songPool: SongLite[];
  /** 메타 변경(곡, 메모, 제목 오버라이드). */
  onPatch: (patch: Partial<Pick<LockedSlot, 'songId' | 'note' | 'songTitleOverride'>>) => void;
  /** 길이 변경 — slot 단위. caller 가 reflow 처리. */
  onResize: (durationSlots: number) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function MatrixLockPanel({ lock, songPool, onPatch, onResize, onDelete, onClose }: Props) {
  const [titleOverride, setTitleOverride] = useState(lock.songTitleOverride ?? '');
  const [note, setNote] = useState(lock.note ?? '');
  const [duration, setDuration] = useState(lock.endSlot - lock.startSlot);

  useEffect(() => {
    setTitleOverride(lock.songTitleOverride ?? '');
    setNote(lock.note ?? '');
    setDuration(lock.endSlot - lock.startSlot);
  }, [lock.id, lock.songTitleOverride, lock.note, lock.endSlot, lock.startSlot]);

  const tone = lock.songId ? songTone(lock.songId, 0) : null;
  const currentSong = useMemo(
    () => (lock.songId ? songPool.find((s) => s.id === lock.songId) : undefined),
    [lock.songId, songPool],
  );

  const save = () => {
    const initialDuration = lock.endSlot - lock.startSlot;
    onPatch({
      songTitleOverride: titleOverride || undefined,
      note: note || undefined,
    });
    if (duration !== initialDuration && duration >= 1) {
      onResize(duration);
    }
    onClose();
  };

  return (
    <div className="bg-card border-border w-full max-w-md rounded-md border shadow-lg">
      <header
        className={cn(
          'px-s-4 py-s-3 gap-s-3 flex items-start justify-between border-b',
          tone?.bg ?? 'bg-success',
        )}
      >
        <div className="min-w-0 flex-1 text-white">
          <div className="text-micro font-bold opacity-80">매트릭스 합주 슬롯</div>
          <div className="text-subtitle truncate font-bold">
            {titleOverride || currentSong?.title || '확정 슬롯'}
          </div>
          <div className="text-micro opacity-80">
            {lock.date} · {slotToTime(lock.startSlot)} ~ {slotToTime(lock.startSlot + duration)} ·{' '}
            {duration * 30}분
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="px-s-4 py-s-3 gap-s-3 flex flex-col">
        <label className="block">
          <div className="text-foreground-muted text-micro mb-1 font-bold uppercase">곡</div>
          <select
            value={lock.songId ?? ''}
            onChange={(e) => onPatch({ songId: e.target.value || undefined })}
            className="bg-surface border-border text-caption w-full rounded-md border px-2 py-1.5"
          >
            <option value="">— 미지정 —</option>
            {songPool.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
                {s.artist ? ` — ${s.artist}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-foreground-muted text-micro mb-1 font-bold uppercase">
            제목 오버라이드 (선택)
          </div>
          <Input
            value={titleOverride}
            onChange={(e) => setTitleOverride(e.target.value)}
            placeholder={currentSong?.title ?? ''}
          />
        </label>

        <label className="block">
          <div className="text-foreground-muted text-micro mb-1 font-bold uppercase">
            길이 (슬롯 = 30분)
          </div>
          <Input
            type="number"
            min={1}
            max={48}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>

        <label className="block">
          <div className="text-foreground-muted text-micro mb-1 font-bold uppercase">메모</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="bg-surface border-border text-caption w-full resize-none rounded-md border px-2 py-1.5"
          />
        </label>
      </div>

      <footer className="border-border px-s-4 py-s-2 gap-s-2 flex items-center justify-between border-t">
        <Button size="sm" variant="danger" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> 삭제
        </Button>
        <div className="gap-s-2 flex">
          <Button size="sm" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" variant="primary" onClick={save}>
            저장
          </Button>
        </div>
      </footer>
    </div>
  );
}
