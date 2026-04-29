'use client';

import { Check, Info, Lock, Pin, Unlock, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { useMatrixLockStore } from '../store/matrixLockStore';
import type { MemberSchedule } from '../types';
import { dayOfWeek, isHoliday, slotToTime } from '../utils';

import type { Member } from '@/domain/setlist-meeting/types';

/** 09:00 ~ 23:00 — 28 슬롯 */
const SLOT_FROM = 18;
const SLOT_TO = 46;
const DOW_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface CellRef {
  date: string;
  slot: number;
}
interface DragRange {
  date: string;
  startSlot: number;
  endSlot: number;
}

interface Props {
  meetingId: string;
  /** 합주 기간 내 모든 일자. */
  allDays: string[];
  participants: Member[];
  memberSchedules: MemberSchedule[];
}

export function MatrixView({ meetingId, allDays, participants, memberSchedules }: Props) {
  const [hover, setHover] = useState<CellRef | null>(null);
  const [pinned, setPinned] = useState<CellRef | null>(null);
  const [drag, setDrag] = useState<DragRange | null>(null);
  const [confirmRange, setConfirmRange] = useState<DragRange | null>(null);
  const toast = useToast();

  const locks = useMatrixLockStore((s) => s.locksByMeeting[meetingId] ?? []);
  const addLock = useMatrixLockStore((s) => s.addLock);
  const removeLock = useMatrixLockStore((s) => s.removeLock);

  /** date+slot → 가능한 userId set. */
  const availability = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const date of allDays) {
      for (let s = SLOT_FROM; s < SLOT_TO; s++) {
        const set = new Set<string>();
        for (const sched of memberSchedules) {
          if (!sched.availableDates.includes(date)) continue;
          if (sched.blocks[date]?.[s]) set.add(sched.userId);
        }
        m.set(`${date}__${s}`, set);
      }
    }
    return m;
  }, [allDays, memberSchedules]);

  const totalMembers = participants.length;
  const ratio = (date: string, slot: number) =>
    totalMembers === 0 ? 0 : (availability.get(`${date}__${slot}`)?.size ?? 0) / totalMembers;

  const isLocked = (date: string, slot: number) =>
    locks.some((l) => l.date === date && slot >= l.startSlot && slot < l.endSlot);

  const lockAt = (date: string, slot: number) =>
    locks.find((l) => l.date === date && slot >= l.startSlot && slot < l.endSlot);

  /** focus = pinned ?? hover (PRD §2.1) */
  const focus: CellRef | null = pinned ?? hover;

  // 셀 색상 (PRD §3.2)
  const cellBg = (date: string, slot: number, dragHit: boolean): string => {
    if (isLocked(date, slot)) return 'bg-success';
    if (dragHit) return 'bg-accent';
    const r = ratio(date, slot);
    if (r === 0) return 'bg-card';
    if (r < 0.25) return 'bg-danger/30';
    if (r < 0.5) return 'bg-warn/45';
    if (r < 0.8) return 'bg-accent/60';
    if (r < 1) return 'bg-success/55';
    return 'bg-success/85';
  };

  const onCellMouseDown =
    (date: string, slot: number) => (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (e.button !== 0) return;
      if (isLocked(date, slot)) return;
      setDrag({ date, startSlot: slot, endSlot: slot + 1 });
    };

  const onCellMouseEnter = (date: string, slot: number) => () => {
    setHover({ date, slot });
    if (drag && drag.date === date) {
      // 같은 행에서만 드래그 확장 (PRD §5.1).
      const startSlot = Math.min(drag.startSlot, slot);
      const endSlot = Math.max(drag.startSlot + 1, slot + 1);
      setDrag({ date, startSlot, endSlot });
    }
  };

  // 매트릭스 컨테이너 mouseup — 어디서든 마우스를 떼면 확정.
  useEffect(() => {
    if (!drag) return;
    const onUp = () => {
      const len = drag.endSlot - drag.startSlot;
      if (len === 1) {
        // 단일 셀 → 핀 토글.
        const cur = { date: drag.date, slot: drag.startSlot };
        setPinned((prev) =>
          prev && prev.date === cur.date && prev.slot === cur.slot ? null : cur,
        );
      } else {
        setConfirmRange(drag);
      }
      setDrag(null);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [drag]);

  const commitConfirm = () => {
    if (!confirmRange) return;
    addLock({
      meetingId,
      date: confirmRange.date,
      startSlot: confirmRange.startSlot,
      endSlot: confirmRange.endSlot,
    });
    toast.success(
      `${confirmRange.date} ${slotToTime(confirmRange.startSlot)}~${slotToTime(confirmRange.endSlot)} 합주 일정 확정`,
    );
    setConfirmRange(null);
    setPinned(null);
  };

  const slots = Array.from({ length: SLOT_TO - SLOT_FROM }, (_, i) => SLOT_FROM + i);

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="text-foreground-muted text-caption px-s-1 gap-s-3 flex items-center justify-between">
          <span>
            셀 <strong className="text-foreground">드래그</strong>로 합주 시간 그리기 · 클릭으로
            정보 고정 · 확정 슬롯은 <strong className="text-success">잠금</strong>
          </span>
          <Legend />
        </div>

        <div className="border-border bg-card flex-1 overflow-auto rounded-md border">
          <table className="w-fit border-collapse select-none">
            <thead>
              <tr>
                <th className="bg-surface border-border sticky top-0 left-0 z-30 w-24 border-r border-b" />
                {slots.map((s) => (
                  <th
                    key={s}
                    className="bg-surface text-foreground-muted border-border text-micro sticky top-0 z-20 w-7 border-b px-0 py-1 text-center font-mono"
                  >
                    {s % 2 === 0 ? slotToTime(s).slice(0, 2) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDays.map((d) => {
                const dow = dayOfWeek(d);
                const holiday = isHoliday(d);
                return (
                  <tr key={d}>
                    <td
                      className={cn(
                        'bg-surface border-border text-caption sticky left-0 z-10 border-r px-2 py-0 font-mono font-bold whitespace-nowrap',
                        (dow === 0 || holiday) && 'text-danger',
                        dow === 6 && 'text-accent',
                      )}
                    >
                      {d.slice(5)} ({DOW_LABEL[dow]})
                    </td>
                    {slots.map((s) => {
                      const dragHit =
                        drag !== null && drag.date === d && s >= drag.startSlot && s < drag.endSlot;
                      const lock = lockAt(d, s);
                      const isLockStart = lock && lock.date === d && lock.startSlot === s;
                      const isPinned = pinned?.date === d && pinned?.slot === s;
                      const isHover = !pinned && hover?.date === d && hover?.slot === s && !lock;
                      const count = availability.get(`${d}__${s}`)?.size ?? 0;
                      return (
                        <td
                          key={s}
                          onMouseDown={onCellMouseDown(d, s)}
                          onMouseEnter={onCellMouseEnter(d, s)}
                          title={`${d} ${slotToTime(s)} — ${count}/${totalMembers}명 가능`}
                          className={cn(
                            'border-border/50 h-5 w-7 border-r border-b transition-colors',
                            cellBg(d, s, dragHit),
                            isLockStart && 'relative',
                            isPinned && 'outline-accent outline outline-2 -outline-offset-2',
                            isHover && 'outline-foreground/50 outline outline-1 -outline-offset-1',
                            lock ? 'cursor-not-allowed' : 'cursor-pointer',
                          )}
                        >
                          {isLockStart && (
                            <Lock className="text-bg mx-auto h-2.5 w-2.5" aria-hidden="true" />
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

        {confirmRange && (
          <ConfirmPreviewCard
            range={confirmRange}
            totalMembers={totalMembers}
            availability={availability}
            onCancel={() => setConfirmRange(null)}
            onCommit={commitConfirm}
          />
        )}
      </div>

      <SidePanel
        focus={focus}
        pinned={!!pinned}
        availability={availability}
        participants={participants}
        memberSchedules={memberSchedules}
        lock={focus ? (lockAt(focus.date, focus.slot) ?? null) : null}
        onUnpin={() => setPinned(null)}
        onUnlock={(lockId) => removeLock(meetingId, lockId)}
      />
    </div>
  );
}

function Legend() {
  const items = [
    { label: '전원', tone: 'bg-success/85' },
    { label: '80%↑', tone: 'bg-success/55' },
    { label: '50%↑', tone: 'bg-accent/60' },
    { label: '소수', tone: 'bg-warn/45' },
  ] as const;
  return (
    <ul className="gap-s-3 flex flex-wrap items-center">
      {items.map((it) => (
        <li key={it.label} className="text-micro gap-s-1 inline-flex items-center font-bold">
          <span className={cn('inline-block h-3 w-3 rounded-sm', it.tone)} />
          <span className="text-foreground-muted">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ConfirmPreviewCard({
  range,
  totalMembers,
  availability,
  onCancel,
  onCommit,
}: {
  range: DragRange;
  totalMembers: number;
  availability: Map<string, Set<string>>;
  onCancel: () => void;
  onCommit: () => void;
}) {
  // 범위 내 모든 슬롯에서 동시 가능한 멤버 = 교집합.
  const intersection = useMemo(() => {
    const slots = Array.from(
      { length: range.endSlot - range.startSlot },
      (_, i) => range.startSlot + i,
    );
    let common: Set<string> | null = null;
    for (const s of slots) {
      const set = availability.get(`${range.date}__${s}`) ?? new Set();
      if (common === null) common = new Set(set);
      else for (const id of common) if (!set.has(id)) common.delete(id);
    }
    return common ?? new Set();
  }, [range, availability]);

  const ratio = totalMembers === 0 ? 0 : intersection.size / totalMembers;
  const hours = ((range.endSlot - range.startSlot) * 30) / 60;
  const borderTone =
    ratio === 1 ? 'border-l-success' : ratio >= 0.7 ? 'border-l-accent' : 'border-l-warn';

  return (
    <div
      className={cn(
        'bg-card border-border px-s-4 py-s-3 gap-s-3 flex items-center rounded-md border border-l-4',
        borderTone,
      )}
    >
      <Check className="text-success h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-caption font-bold">합주 시간 확정 미리보기</div>
        <div className="text-foreground text-body mt-0.5 font-mono font-bold">
          {range.date} {slotToTime(range.startSlot)} ~ {slotToTime(range.endSlot)}
        </div>
        <div className="text-foreground-muted text-micro mt-0.5">
          {intersection.size}/{totalMembers}명 가능 · {hours}시간
          {intersection.size < totalMembers && (
            <span className="text-warn ml-2 font-bold">
              · {totalMembers - intersection.size}명 시간 안 맞음
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        취소
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onCommit}
        className="bg-success hover:bg-success/90 text-white"
      >
        <Lock className="h-4 w-4" /> 확정 & 잠금
      </Button>
    </div>
  );
}

function SidePanel({
  focus,
  pinned,
  availability,
  participants,
  memberSchedules,
  lock,
  onUnpin,
  onUnlock,
}: {
  focus: CellRef | null;
  pinned: boolean;
  availability: Map<string, Set<string>>;
  participants: Member[];
  memberSchedules: MemberSchedule[];
  lock: { id: string; startSlot: number; endSlot: number; date: string } | null;
  onUnpin: () => void;
  onUnlock: (lockId: string) => void;
}) {
  if (!focus) {
    return (
      <aside className="bg-card border-border w-80 shrink-0 rounded-md border">
        <div className="px-s-4 py-s-8 text-foreground-muted text-caption flex h-full flex-col items-center justify-center gap-2 text-center">
          <Info className="h-5 w-5 opacity-60" />
          매트릭스의 셀에 호버하면
          <br />
          해당 시간의 멤버 가용성이 표시됩니다.
        </div>
      </aside>
    );
  }

  const dow = dayOfWeek(focus.date);
  const dowLabel = DOW_LABEL[dow];
  const availableIds = availability.get(`${focus.date}__${focus.slot}`) ?? new Set<string>();
  const total = participants.length;

  // unavailable: schedule 가 있는데 이 슬롯이 false 인 멤버.
  const unavailable: Array<{ member: Member; reason?: string }> = [];
  const available: Member[] = [];
  for (const m of participants) {
    if (availableIds.has(m.id)) {
      available.push(m);
    } else {
      const sched = memberSchedules.find((s) => s.userId === m.id);
      const reason = !sched
        ? '미입력'
        : !sched.availableDates.includes(focus.date)
          ? '선약'
          : '시간';
      unavailable.push({ member: m, reason });
    }
  }

  return (
    <aside className="bg-card border-border flex w-80 shrink-0 flex-col overflow-hidden rounded-md border">
      <div className="border-border px-s-4 py-s-3 border-b">
        <div className="text-foreground-muted text-micro gap-s-1 flex items-center font-bold uppercase">
          {lock ? (
            <>
              <Lock className="h-3 w-3" /> 고정됨
            </>
          ) : pinned ? (
            <>
              <Pin className="h-3 w-3" /> 고정됨
            </>
          ) : (
            <>호버 중</>
          )}
        </div>
        <div className="text-foreground text-body mt-0.5 font-mono font-bold">
          {focus.date} ({dowLabel}) {slotToTime(focus.slot)}
        </div>
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
        {pinned && !lock && (
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

      {lock && (
        <div className="border-border px-s-3 py-s-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnlock(lock.id)}
            className="text-danger w-full"
          >
            <Unlock className="h-4 w-4" /> 이 슬롯 잠금 해제
          </Button>
          <p className="text-foreground-muted text-micro mt-s-2 text-center">
            현재 이 슬롯은 잠겨 있습니다 — 다른 곡 합주 후보에서 자동 제외.
          </p>
        </div>
      )}
    </aside>
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
