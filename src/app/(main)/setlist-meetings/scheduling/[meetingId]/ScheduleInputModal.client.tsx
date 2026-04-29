'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { Textarea } from '@/components/ui/textarea';
import { WeeklyScheduleGrid } from '@/domain/schedule-coordination/components/WeeklyScheduleGrid.client';
import {
  DEFAULT_DAY_MASK,
  useScheduleStore,
} from '@/domain/schedule-coordination/store/scheduleStore';
import type { SlotMask } from '@/domain/schedule-coordination/types';
import {
  addDays,
  dayOfWeek,
  isHoliday,
  isWeekend,
  startOfWeek,
} from '@/domain/schedule-coordination/utils';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const STEPS = ['가능 일자', '시간 블록', '특이사항', '확인'] as const;
type Step = 0 | 1 | 2 | 3;

type DateFilter = 'all' | 'weekday' | 'weekend' | 'no-holidays';

export function ScheduleInputModal({
  meetingId,
  userId,
  allDays,
  open,
  onOpenChange,
}: {
  meetingId: string;
  userId: string;
  allDays: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const existing = useScheduleStore((s) => s.schedules[`${meetingId}__${userId}`]);
  const upsert = useScheduleStore((s) => s.upsertSchedule);
  const setCompleted = useScheduleStore((s) => s.setCompleted);
  const toast = useToast();

  const [step, setStep] = useState<Step>(0);
  const [availableDates, setAvailableDates] = useState<string[]>(existing?.availableDates ?? []);
  const [blocks, setBlocks] = useState<Record<string, SlotMask>>(existing?.blocks ?? {});
  const [note, setNote] = useState(existing?.note ?? '');

  // 모달이 닫힌→열린 전환 시점에만 store 값으로 hydrate. 그 후 store 갱신은 effect 내부에서
  // 일어나므로 existing 변화로는 재 hydrate 하지 않음(무한 루프 방지).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setStep(0);
      setAvailableDates(existing?.availableDates ?? []);
      setBlocks(existing?.blocks ?? {});
      setNote(existing?.note ?? '');
    } else if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
    // existing 은 의도적으로 deps 에서 제외 — 첫 오픈 시에만 사용.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 입력 변동 시 즉시 store 에 저장 → localStorage 영속화 (실수 종료해도 유지).
  // 기존 completed 는 store 에서 직접 읽지 않고 첫 hydrate 이후엔 별도 setCompleted 로만 변경.
  const completedRef = useRef(existing?.completed ?? false);
  useEffect(() => {
    completedRef.current = existing?.completed ?? false;
  }, [existing?.completed]);

  useEffect(() => {
    if (!open) return;
    upsert({
      meetingId,
      userId,
      availableDates,
      unavailableDates: [],
      blocks,
      note,
      completed: completedRef.current,
      updatedAt: new Date().toISOString(),
    });
  }, [open, meetingId, userId, availableDates, blocks, note, upsert]);

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  const back = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));

  // 9-E 실시간 요약 — 입력 즉시 갱신.
  const summary = useMemo(() => {
    const dayCount = availableDates.length;
    const totalMinutes = Object.values(blocks).reduce(
      (acc, mask) => acc + mask.filter(Boolean).length * 30,
      0,
    );
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `선택: ${dayCount}일 / 합 ${hours}시간 ${mins ? `${mins}분` : ''}`.trim();
  }, [availableDates, blocks]);

  const submit = () => {
    setCompleted(meetingId, userId, true);
    toast.success('나의 스케줄이 저장되었습니다.');
    onOpenChange(false);
  };

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="sm:max-w-2xl">
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>나의 스케줄 입력</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <ResponsiveSheetBody>
          <ProgressBar step={step} />
          <div className="mt-s-4">
            {step === 0 && (
              <Step1Dates
                allDays={allDays}
                availableDates={availableDates}
                setAvailableDates={setAvailableDates}
              />
            )}
            {step === 1 && (
              <Step2Blocks
                allDays={allDays}
                availableDates={availableDates}
                blocks={blocks}
                setBlocks={setBlocks}
              />
            )}
            {step === 2 && <Step3Note note={note} setNote={setNote} />}
            {step === 3 && (
              <Step4Review availableDates={availableDates} blocks={blocks} note={note} />
            )}
          </div>
          <p className="text-foreground-muted text-micro mt-s-3 font-mono tabular-nums">
            {summary}
          </p>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
            이전
          </Button>
          {step < 3 ? (
            <Button type="button" variant="primary" onClick={next}>
              다음
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={submit}>
              저장
            </Button>
          )}
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="border-border gap-s-1 pb-s-3 flex items-center border-b">
      {STEPS.map((label, i) => (
        <div key={label} className="flex-1 text-center">
          <div
            className={cn(
              'text-micro mb-1 font-bold',
              i === step ? 'text-accent' : i < step ? 'text-success' : 'text-foreground-muted',
            )}
          >
            {i + 1}. {label}
          </div>
          <div
            className={cn(
              'h-1 rounded-full',
              i === step ? 'bg-accent' : i < step ? 'bg-success' : 'bg-card',
            )}
          />
        </div>
      ))}
    </div>
  );
}

// Step 0 input-mode 탭 제거 (Task 9 v2). AI 입력은 PRD §5-B 비범위.

// Step 1: 가능 일자
function Step1Dates({
  allDays,
  availableDates,
  setAvailableDates,
}: {
  allDays: string[];
  availableDates: string[];
  setAvailableDates: (next: string[]) => void;
}) {
  const [filter, setFilter] = useState<DateFilter>('all');

  const passesFilter = (d: string) => {
    if (filter === 'weekday') return !isWeekend(d);
    if (filter === 'weekend') return isWeekend(d);
    if (filter === 'no-holidays') return !isHoliday(d);
    return true;
  };

  const toggle = (d: string) => {
    if (availableDates.includes(d)) {
      setAvailableDates(availableDates.filter((x) => x !== d));
    } else {
      setAvailableDates([...availableDates, d]);
    }
  };

  const applyFilter = () => {
    setAvailableDates(allDays.filter(passesFilter));
  };

  return (
    <section className="gap-s-3 flex flex-col">
      <p className="text-foreground-muted text-caption">
        합주 가능한 일자를 선택하세요. 필터를 적용하면 일괄 선택됩니다.
      </p>
      <div className="gap-s-2 flex flex-wrap">
        {(['all', 'weekday', 'weekend', 'no-holidays'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'px-s-3 py-s-1 text-micro rounded-full border font-semibold',
              filter === f
                ? 'bg-accent-dim border-accent/40 text-accent'
                : 'bg-card border-border text-foreground-muted hover:border-border-hi',
            )}
          >
            {f === 'all'
              ? '전체'
              : f === 'weekday'
                ? '평일'
                : f === 'weekend'
                  ? '주말'
                  : '공휴일 제외'}
          </button>
        ))}
        <button
          type="button"
          onClick={applyFilter}
          className="text-accent text-micro ml-auto font-semibold hover:underline"
        >
          필터로 일괄 선택
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="text-foreground-muted text-micro text-center font-bold">
            {d}
          </div>
        ))}
        {allDays.length > 0 &&
          // 첫 일자의 요일만큼 빈 칸 채워 정렬.
          Array.from({ length: dayOfWeek(allDays[0]!) }).map((_, i) => <div key={`pad-${i}`} />)}
        {allDays.map((d) => {
          const selected = availableDates.includes(d);
          const dim = !passesFilter(d);
          const holiday = isHoliday(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              className={cn(
                'text-caption rounded-md px-1 py-2 text-center font-mono font-bold',
                selected
                  ? 'bg-accent text-foreground'
                  : 'bg-card text-foreground-muted hover:bg-card-hover',
                holiday && !selected && 'text-danger',
                dim && !selected && 'opacity-40',
              )}
            >
              {d.slice(8)}
            </button>
          );
        })}
      </div>
      <div className="text-foreground-sub text-caption">
        선택 <strong className="text-foreground">{availableDates.length}</strong>일
      </div>
    </section>
  );
}

// Step 2: 시간 블록 — 합주 시간표 생성 탭과 동일한 WeeklyScheduleGrid 사용.
function Step2Blocks({
  availableDates,
  blocks,
  setBlocks,
}: {
  allDays: string[];
  availableDates: string[];
  blocks: Record<string, SlotMask>;
  setBlocks: (next: Record<string, SlotMask>) => void;
}) {
  const sortedAvail = useMemo(() => [...availableDates].sort(), [availableDates]);
  const compact = sortedAvail.length > 0 && sortedAvail.length <= 7;
  const firstWeekStart = useMemo(
    () => (sortedAvail[0] ? startOfWeek(sortedAvail[0]) : ''),
    [sortedAvail],
  );
  const [weekStart, setWeekStart] = useState(firstWeekStart);
  const [range, setRange] = useState<'9-22' | '24h'>('9-22');
  const slotStart = range === '24h' ? 0 : 18;
  const slotEnd = range === '24h' ? 48 : 44;

  const visibleDays = useMemo<string[]>(() => {
    if (sortedAvail.length === 0) return [];
    if (compact) return sortedAvail;
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [compact, sortedAvail, weekStart]);

  const availSet = useMemo(() => new Set(sortedAvail), [sortedAvail]);
  const isInWindow = (d: string) => availSet.has(d);

  const ensureMask = (date: string): SlotMask => blocks[date] ?? [...DEFAULT_DAY_MASK];

  const toggleSlot = (date: string, slot: number) => {
    const mask = ensureMask(date);
    const next = mask.slice();
    next[slot] = !next[slot];
    setBlocks({ ...blocks, [date]: next });
  };

  // 9-B 프리셋 칩 — 현재 보이는 가능 일자에 일괄 적용. shift=추가, alt=제거.
  const PRESETS: Array<{ id: string; label: string; range: [number, number] }> = [
    { id: 'morning', label: '오전 09-12', range: [18, 24] },
    { id: 'lunch', label: '점심 12-14', range: [24, 28] },
    { id: 'afternoon', label: '오후 14-18', range: [28, 36] },
    { id: 'evening', label: '저녁 18-22', range: [36, 44] },
    { id: 'night', label: '심야 22-02', range: [44, 52] },
  ];

  const applyPreset = (preset: (typeof PRESETS)[number], mode: 'set' | 'add' | 'remove') => {
    const [from, to] = preset.range;
    const upd: Record<string, SlotMask> = { ...blocks };
    const targets = visibleDays.filter(isInWindow);
    for (const d of targets) {
      const mask = mode === 'set' ? Array.from({ length: 48 }, () => false) : ensureMask(d).slice();
      for (let i = from; i < Math.min(48, to); i++) {
        mask[i] = mode === 'remove' ? false : true;
      }
      upd[d] = mask;
    }
    setBlocks(upd);
  };

  // 9-C 전 주 복사 — week 모드 한정.
  const copyPrevWeek = () => {
    if (compact) return;
    const targets = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const prev = targets.map((d) => addDays(d, -7));
    const upd: Record<string, SlotMask> = { ...blocks };
    let changed = false;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]!;
      const source = prev[i]!;
      if (!availSet.has(target)) continue;
      const sourceMask = blocks[source];
      if (!sourceMask) continue;
      upd[target] = sourceMask.slice();
      changed = true;
    }
    if (changed) setBlocks(upd);
  };

  // 9-F Smart Default — 평일 저녁 + 주말 종일.
  const applySmartDefault = () => {
    const upd: Record<string, SlotMask> = { ...blocks };
    for (const d of availableDates) {
      const day = new Date(`${d}T00:00:00`).getDay();
      const isWk = day === 0 || day === 6;
      const mask = Array.from({ length: 48 }, (_, i) =>
        isWk ? i >= 18 && i < 44 : i >= 36 && i < 44,
      );
      upd[d] = mask;
    }
    setBlocks(upd);
  };

  if (sortedAvail.length === 0) {
    return (
      <p className="text-foreground-muted text-caption py-s-6 text-center">
        먼저 이전 단계에서 가능한 일자를 선택하세요.
      </p>
    );
  }

  const firstAvail = sortedAvail[0]!;
  const lastAvail = sortedAvail[sortedAvail.length - 1]!;
  const canPrev = !compact && weekStart > startOfWeek(firstAvail);
  const canNext = !compact && weekStart < startOfWeek(lastAvail);

  return (
    <section className="gap-s-3 flex flex-col">
      {/* 주차 라벨 + 네비 (compact 일 때 숨김). */}
      {!compact && (
        <div className="gap-s-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => canPrev && setWeekStart(addDays(weekStart, -7))}
            disabled={!canPrev}
            className="text-foreground-muted hover:text-foreground rounded p-1 disabled:opacity-30"
            aria-label="이전 주"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-caption font-mono font-bold">
            {weekStart} ~ {addDays(weekStart, 6)}
          </span>
          <button
            type="button"
            onClick={() => canNext && setWeekStart(addDays(weekStart, 7))}
            disabled={!canNext}
            className="text-foreground-muted hover:text-foreground rounded p-1 disabled:opacity-30"
            aria-label="다음 주"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="text-foreground-muted text-micro">
        30분 단위. 셀 클릭으로 가능/불가 토글. 프리셋 칩으로 현재 주 일괄 적용.
      </p>

      <div className="gap-s-2 flex flex-wrap items-center">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={(e) => applyPreset(p, e.altKey ? 'remove' : e.shiftKey ? 'add' : 'set')}
            className="bg-card border-border hover:border-accent text-foreground-sub text-micro px-s-2 rounded-full border py-1 font-bold"
            title="Shift: 추가 / Alt: 제거"
          >
            {p.label}
          </button>
        ))}
        {!compact && (
          <button
            type="button"
            onClick={copyPrevWeek}
            className="text-accent text-micro ml-auto font-bold hover:underline"
          >
            전 주와 동일
          </button>
        )}
        <button
          type="button"
          onClick={applySmartDefault}
          className={cn('text-accent text-micro font-bold hover:underline', compact && 'ml-auto')}
        >
          Smart Default
        </button>
        <div
          role="radiogroup"
          aria-label="시간 범위"
          className="bg-card border-border ml-s-2 inline-flex rounded-md border p-0.5"
        >
          {(['9-22', '24h'] as const).map((r) => {
            const active = r === range;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRange(r)}
                className={cn(
                  'text-micro px-s-2 rounded py-0.5 font-bold transition-colors',
                  active
                    ? 'bg-accent text-bg shadow-sm'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                {r === '24h' ? '24h' : '09-22'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[420px]">
        <WeeklyScheduleGrid
          days={visibleDays}
          slotStart={slotStart}
          slotEnd={slotEnd}
          isInWindow={isInWindow}
          onCellClick={toggleSlot}
          cellClassName={(d, s, inWindow) => {
            if (!inWindow) return undefined;
            const mask = blocks[d];
            return mask?.[s] ? 'bg-accent/80' : undefined;
          }}
        />
      </div>
    </section>
  );
}

function Step3Note({ note, setNote }: { note: string; setNote: (n: string) => void }) {
  return (
    <section className="gap-s-3 flex flex-col">
      <Textarea
        label="특이사항"
        rows={5}
        maxLength={200}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="합주 일정 결정 시 참고할 특이사항을 적어주세요. (예: 매주 금요일은 오후 8시 이후만 가능)"
      />
      <div className="text-foreground-muted text-micro text-right">{note.length}/200</div>
    </section>
  );
}

function Step4Review({
  availableDates,
  blocks,
  note,
}: {
  availableDates: string[];
  blocks: Record<string, SlotMask>;
  note: string;
}) {
  const totalSlots = Object.values(blocks).reduce(
    (acc, mask) => acc + mask.filter(Boolean).length,
    0,
  );
  return (
    <section className="gap-s-3 flex flex-col">
      <SummaryRow label="가능 일자">{availableDates.length}일</SummaryRow>
      <SummaryRow label="총 가능 시간">{Math.round((totalSlots * 30) / 60)}시간</SummaryRow>
      <SummaryRow label="특이사항">
        {note || <span className="text-foreground-muted">(없음)</span>}
      </SummaryRow>
    </section>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border-border px-s-4 py-s-3 gap-s-3 flex items-center rounded-lg border">
      <div className="text-foreground-muted text-micro w-24 shrink-0 font-bold uppercase">
        {label}
      </div>
      <div className="text-foreground text-caption flex-1">{children}</div>
    </div>
  );
}
