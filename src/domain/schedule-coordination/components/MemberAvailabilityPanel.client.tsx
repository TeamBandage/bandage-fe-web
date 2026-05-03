'use client';

import { Check, Info, Lock, Pin, Unlock, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import type { MemberSchedule, ScheduleBlock } from '../types';
import { dayOfWeek, slotToTime } from '../utils';

import type { Member } from '@/domain/setlist-meeting/types';

const DOW_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface SongLite {
  id: string;
  title: string;
  artist?: string | null;
}

export interface MemberAvailabilityPanelProps {
  /** 표시 기준 셀 — null 이면 placeholder. */
  cell: { date: string; slot: number } | null;
  /** date+slot → 가능한 userId set. caller 가 buildCoverageHeatmap 으로 만들어 전달. */
  availability: Map<string, Set<string>>;
  participants: Member[];
  memberSchedules: MemberSchedule[];
  songMap?: Map<string, SongLite>;
  /** 셀 위에 배치된 합주 블록(있으면). 라벨/제거 버튼 노출 트리거. */
  block?: ScheduleBlock | null;
  /** 사용자가 의도적으로 셀을 핀 했는지 — 라벨 분기용. */
  pinned?: boolean;
  onUnpin?: () => void;
  onRemoveBlock?: (blockId: string) => void;
  className?: string;
  /** placeholder 안내 문구 — 매트릭스/주차별 공통 사용. */
  placeholder?: string;
}

/**
 * 매트릭스/주차별 UI 공통 — 선택된 셀의 가능/불가 인원을 풍부하게 표시.
 * 헤더(상태 라벨/일시/곡/진행도) + 가능 멤버 + 불가 멤버 + 합주 슬롯 제거 버튼.
 */
export function MemberAvailabilityPanel({
  cell,
  availability,
  participants,
  memberSchedules,
  songMap,
  block = null,
  pinned = false,
  onUnpin,
  onRemoveBlock,
  className,
  placeholder = '셀을 클릭하면 해당 시간의 멤버 가용성이 표시됩니다.',
}: MemberAvailabilityPanelProps) {
  if (!cell) {
    return (
      <div
        className={cn(
          'bg-card border-border flex flex-1 flex-col items-center justify-center gap-2 rounded-md border p-6 text-center shadow-sm',
          className,
        )}
      >
        <Info className="text-foreground-muted/60 h-5 w-5" />
        <p className="text-foreground-muted text-caption whitespace-pre-line">{placeholder}</p>
      </div>
    );
  }

  const dow = dayOfWeek(cell.date);
  const dowLabel = DOW_LABEL[dow];
  const availableIds = availability.get(`${cell.date}__${cell.slot}`) ?? new Set<string>();
  const total = participants.length;

  const unavailable: Array<{ member: Member; reason?: string }> = [];
  const available: Member[] = [];
  for (const m of participants) {
    if (availableIds.has(m.id)) {
      available.push(m);
    } else {
      const sched = memberSchedules.find((s) => s.userId === m.id);
      const reason = !sched
        ? '미입력'
        : !sched.availableDates.includes(cell.date)
          ? '선약'
          : '시간';
      unavailable.push({ member: m, reason });
    }
  }
  const blockedSong = block?.songId ? songMap?.get(block.songId) : null;

  return (
    <div
      className={cn(
        'bg-card border-border flex flex-1 flex-col overflow-hidden rounded-md border shadow-sm',
        className,
      )}
    >
      <div className="border-border px-s-4 py-s-3 border-b">
        <div className="text-foreground-muted text-micro gap-s-1 flex items-center font-bold uppercase">
          {block ? (
            <>
              <Lock className="h-3 w-3" /> 합주 배치됨
            </>
          ) : pinned ? (
            <>
              <Pin className="h-3 w-3" /> 고정됨
            </>
          ) : (
            <>선택됨</>
          )}
        </div>
        <div className="text-foreground text-body mt-0.5 font-mono font-bold">
          {cell.date} ({dowLabel}) {slotToTime(cell.slot)}
        </div>
        {blockedSong && (
          <div className="text-accent text-caption mt-0.5 font-bold">{blockedSong.title}</div>
        )}
        <div className="mt-s-2 gap-s-2 flex items-center">
          <div
            className="bg-bg/40 h-2 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={available.length}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className={cn(
                'h-full transition-all',
                available.length === total ? 'bg-success' : 'bg-accent',
              )}
              style={{
                width: `${total === 0 ? 0 : Math.round((available.length / total) * 100)}%`,
              }}
            />
          </div>
          <span className="text-caption text-foreground font-bold tabular-nums">
            {available.length}/{total}
          </span>
        </div>
        {pinned && !block && onUnpin && (
          <button
            type="button"
            onClick={onUnpin}
            className="text-foreground-muted hover:text-foreground text-micro mt-s-2 inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> 고정 해제
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {available.length > 0 && (
          <div className="px-s-3 py-s-3">
            <div className="text-success text-caption mb-s-2 gap-s-1 flex items-center font-bold">
              <Check className="h-3.5 w-3.5" /> 가능 ({available.length}명)
            </div>
            <ul className="gap-s-1 flex flex-col">
              {available.map((m) => (
                <li key={m.id}>
                  <MemberChip member={m} variant="ok" />
                </li>
              ))}
            </ul>
          </div>
        )}
        {unavailable.length > 0 && (
          <div className="border-border px-s-3 py-s-3 border-t">
            <div className="text-danger text-caption mb-s-2 gap-s-1 flex items-center font-bold">
              <X className="h-3.5 w-3.5" /> 불가 ({unavailable.length}명)
            </div>
            <ul className="gap-s-1 flex flex-col">
              {unavailable.map(({ member, reason }) => (
                <li key={member.id}>
                  <MemberChip member={member} variant="no" reason={reason} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {block && onRemoveBlock && (
        <div className="border-border px-s-3 py-s-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveBlock(block.blockId)}
            className="text-danger w-full"
          >
            <Unlock className="h-4 w-4" /> 이 합주 슬롯 제거
          </Button>
        </div>
      )}
    </div>
  );
}

function MemberChip({
  member,
  variant,
  reason,
}: {
  member: Member;
  variant: 'ok' | 'no';
  reason?: string;
}) {
  const initial = member.name.slice(0, 1);
  return (
    <div
      className={cn(
        'gap-s-2 flex items-center rounded-md px-2 py-1.5',
        variant === 'ok' ? 'bg-success-dim' : 'bg-danger-dim grayscale-[0.4]',
      )}
    >
      <span
        className="text-bg inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: member.avatar ?? '#6b6b80' }}
      >
        {initial}
      </span>
      <span className="text-caption flex-1 truncate font-bold">{member.name}</span>
      <span className="text-foreground-muted text-micro">{member.role ?? ''}</span>
      {variant === 'no' && reason && (
        <span className="bg-danger-dim text-danger text-micro px-s-2 rounded-full py-0.5 font-bold">
          {reason}
        </span>
      )}
    </div>
  );
}
