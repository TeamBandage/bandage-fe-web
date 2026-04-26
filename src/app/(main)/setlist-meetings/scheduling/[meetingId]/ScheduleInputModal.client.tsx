'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  slotToTime,
  startOfWeek,
} from '@/domain/schedule-coordination/utils';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const STEPS = ['입력 방식', '가능 일자', '시간 블록', '특이사항', '확인'] as const;
type Step = 0 | 1 | 2 | 3 | 4;

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
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>('manual');
  const [availableDates, setAvailableDates] = useState<string[]>(existing?.availableDates ?? []);
  const [blocks, setBlocks] = useState<Record<string, SlotMask>>(existing?.blocks ?? {});
  const [note, setNote] = useState(existing?.note ?? '');

  // 모달 열릴 때 기존 입력으로 hydrate (localStorage 영속화 + 이미 store 에 있음).
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setInputMode('manual');
    setAvailableDates(existing?.availableDates ?? []);
    setBlocks(existing?.blocks ?? {});
    setNote(existing?.note ?? '');
  }, [open, existing]);

  // 입력 변동 시 즉시 store 에 저장 → localStorage 영속화 (실수 종료해도 유지).
  useEffect(() => {
    if (!open) return;
    upsert({
      meetingId,
      userId,
      availableDates,
      unavailableDates: [],
      blocks,
      note,
      completed: existing?.completed ?? false,
      updatedAt: new Date().toISOString(),
    });
  }, [open, meetingId, userId, availableDates, blocks, note, existing?.completed, upsert]);

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const back = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));

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
            {step === 0 && <Step0InputMode value={inputMode} onChange={setInputMode} />}
            {step === 1 && (
              <Step1Dates
                allDays={allDays}
                availableDates={availableDates}
                setAvailableDates={setAvailableDates}
              />
            )}
            {step === 2 && (
              <Step2Blocks
                allDays={allDays}
                availableDates={availableDates}
                blocks={blocks}
                setBlocks={setBlocks}
              />
            )}
            {step === 3 && <Step3Note note={note} setNote={setNote} />}
            {step === 4 && (
              <Step4Review
                inputMode={inputMode}
                availableDates={availableDates}
                blocks={blocks}
                note={note}
              />
            )}
          </div>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
            이전
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              variant="primary"
              onClick={next}
              disabled={step === 0 && inputMode === 'ai'}
            >
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

// Step 0
function Step0InputMode({
  value,
  onChange,
}: {
  value: 'ai' | 'manual';
  onChange: (v: 'ai' | 'manual') => void;
}) {
  return (
    <section className="gap-s-3 flex flex-col">
      <UnderlineTabs
        value={value}
        onChange={(v) => onChange(v as 'ai' | 'manual')}
        items={[
          { id: 'manual', label: '스케줄 입력' },
          { id: 'ai', label: 'AI 입력' },
        ]}
      />
      {value === 'ai' ? (
        <div className="bg-card border-border px-s-4 py-s-8 text-foreground-muted text-caption rounded-lg border border-dashed text-center">
          AI 자동 입력은 준비 중입니다. 곧 제공됩니다.
        </div>
      ) : (
        <p className="text-foreground-muted text-caption">
          이어지는 단계에서 합주 가능 일자와 시간 블록, 특이사항을 입력합니다.
        </p>
      )}
    </section>
  );
}

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

// Step 2: 시간 블록 (when2meet 스타일, 1주 단위)
function Step2Blocks({
  allDays,
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
  const firstWeekStart = useMemo(
    () => (sortedAvail[0] ? startOfWeek(sortedAvail[0]) : startOfWeek(allDays[0] ?? '')),
    [sortedAvail, allDays],
  );
  const [weekStart, setWeekStart] = useState(firstWeekStart);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekAvailDates = weekDates.filter((d) => availableDates.includes(d));

  // 기본 9:00~22:00 활성. 사용자가 selected 한 cell 만 boolean.
  const ensureMask = (date: string): SlotMask => blocks[date] ?? [...DEFAULT_DAY_MASK];

  const toggleSlot = (date: string, slot: number) => {
    const mask = ensureMask(date);
    const next = mask.slice();
    next[slot] = !next[slot];
    setBlocks({ ...blocks, [date]: next });
  };

  if (sortedAvail.length === 0) {
    return (
      <p className="text-foreground-muted text-caption py-s-6 text-center">
        먼저 이전 단계에서 가능한 일자를 선택하세요.
      </p>
    );
  }

  return (
    <section className="gap-s-3 flex flex-col">
      <div className="gap-s-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="text-foreground-muted hover:text-foreground p-1"
          aria-label="이전 주"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-caption font-mono font-bold">
          {weekStart} ~ {addDays(weekStart, 6)}
        </span>
        <button
          type="button"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="text-foreground-muted hover:text-foreground p-1"
          aria-label="다음 주"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <p className="text-foreground-muted text-micro">
        30분 단위. 셀 클릭으로 가능/불가 토글. 기본 09:00~22:00 가능.
      </p>
      {weekAvailDates.length === 0 ? (
        <p className="text-foreground-muted text-caption py-s-4 text-center">
          이 주에 선택된 일자가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-micro w-full">
            <thead>
              <tr>
                <th className="px-1 py-1"></th>
                {[18, 22, 26, 30, 34, 38, 42].map((s) => (
                  <th key={s} className="text-foreground-muted px-1 py-1 text-center">
                    {slotToTime(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekAvailDates.map((d) => {
                const mask = ensureMask(d);
                return (
                  <tr key={d}>
                    <td className="px-1 py-1 font-mono">{d.slice(5)}</td>
                    {Array.from({ length: 26 }, (_, i) => 18 + i).map((s) => (
                      <td key={s} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggleSlot(d, s)}
                          aria-label={`${d} ${slotToTime(s)}`}
                          className={cn(
                            'h-6 w-full border-r border-b transition-colors',
                            mask[s]
                              ? 'bg-accent border-accent-hi'
                              : 'bg-card border-border hover:bg-card-hover',
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
  inputMode,
  availableDates,
  blocks,
  note,
}: {
  inputMode: 'ai' | 'manual';
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
      <SummaryRow label="입력 방식">
        {inputMode === 'manual' ? '스케줄 입력' : 'AI 입력 (준비 중)'}
      </SummaryRow>
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

function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: ReadonlyArray<{ id: T; label: string }>;
}) {
  return (
    <div className="border-border gap-s-6 flex border-b">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              'px-s-1 -mb-px h-10 border-b-2 text-sm font-semibold transition-colors',
              active
                ? 'border-accent text-accent'
                : 'text-foreground-sub hover:text-foreground border-transparent',
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
