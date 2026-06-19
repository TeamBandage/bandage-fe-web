'use client';

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { KST } from '@/lib/date';
import { cn } from '@/lib/cn';

import type {
  AvailabilityExceptionRequest,
  AvailabilityKind,
  DayOfWeek,
  MemberAvailabilityResponse,
  WeeklyRuleRequest,
} from '../types';

const DAY_OF_WEEK_KEYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const START_SLOT = 18;
const END_SLOT = 44;
const SLOT_COUNT = END_SLOT - START_SLOT;
const CELL_HEIGHT = 22;

function slotToTimeLabel(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 2 + ((m ?? 0) >= 30 ? 1 : 0);
}

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2)
    .toString()
    .padStart(2, '0');
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

type GridState = boolean[][];

function emptyGrid(): GridState {
  return Array.from({ length: 7 }, () => Array(SLOT_COUNT).fill(false));
}

function availabilityToGrid(availability: MemberAvailabilityResponse | undefined): GridState {
  const grid = emptyGrid();
  if (!availability) return grid;

  for (const rule of availability.weeklyRules) {
    const dayIdx = DAY_OF_WEEK_KEYS.indexOf(rule.dayOfWeek);
    if (dayIdx === -1) continue;
    for (let s = rule.startSlot; s < rule.endSlot; s++) {
      const idx = s - START_SLOT;
      if (idx >= 0 && idx < SLOT_COUNT) grid[dayIdx]![idx] = true;
    }
  }
  return grid;
}

function gridToWeeklyRules(
  grid: GridState,
  effectiveFrom: string,
  effectiveTo: string,
): WeeklyRuleRequest[] {
  const rules: WeeklyRuleRequest[] = [];
  for (let d = 0; d < 7; d++) {
    const dayOfWeek = DAY_OF_WEEK_KEYS[d];
    if (!dayOfWeek) continue;
    const daySlots = grid[d]!;
    let i = 0;
    while (i < SLOT_COUNT) {
      if (daySlots[i]) {
        const start = i;
        while (i < SLOT_COUNT && daySlots[i]) i++;
        rules.push({
          dayOfWeek,
          startSlot: start + START_SLOT,
          endSlot: i + START_SLOT,
          effectiveFrom,
          effectiveTo: effectiveTo || undefined,
        });
      } else {
        i++;
      }
    }
  }
  return rules;
}

function hasAnySelected(grid: GridState): boolean {
  return grid.some((day) => day.some(Boolean));
}

type Props = {
  open: boolean;
  onClose: () => void;
  availability: MemberAvailabilityResponse | undefined;
  onSave: (
    weeklyRules: WeeklyRuleRequest[],
    note: string,
    exceptions: AvailabilityExceptionRequest[],
  ) => void;
  isSaving?: boolean;
};

export function ScheduleManagerModal({ open, onClose, availability, onSave, isSaving }: Props) {
  const today = format(toZonedTime(new Date(), KST), 'yyyy-MM-dd');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [effectiveTo, setEffectiveTo] = useState('');
  const [grid, setGrid] = useState<GridState>(emptyGrid);
  const [exceptions, setExceptions] = useState<AvailabilityExceptionRequest[]>([]);
  const [note, setNote] = useState('');

  const [newExcDate, setNewExcDate] = useState('');
  const [newExcKind, setNewExcKind] = useState<AvailabilityKind>('BLOCKED');
  const [newExcAllDay, setNewExcAllDay] = useState(true);
  const [newExcStartTime, setNewExcStartTime] = useState('09:00');
  const [newExcEndTime, setNewExcEndTime] = useState('18:00');

  const dragState = useRef<{
    active: boolean;
    dayIdx: number;
    painting: boolean;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      const firstRule = availability?.weeklyRules[0];
      setEffectiveFrom(firstRule?.effectiveFrom ?? today);
      setEffectiveTo(firstRule?.effectiveTo ?? '');
      setGrid(availabilityToGrid(availability));
      setExceptions(availability?.exceptions ?? []);
      setNote(availability?.note ?? '');
      setNewExcDate('');
      setNewExcKind('BLOCKED');
      setNewExcAllDay(true);
      setNewExcStartTime('09:00');
      setNewExcEndTime('18:00');
    }
  }, [open, availability, today]);

  const toggleSlot = useCallback((dayIdx: number, slotIdx: number, paint: boolean) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[dayIdx]![slotIdx] = paint;
      return next;
    });
  }, []);

  const handlePointerDown = (dayIdx: number, slotIdx: number) => {
    const painting = !grid[dayIdx]![slotIdx];
    dragState.current = { active: true, dayIdx, painting };
    toggleSlot(dayIdx, slotIdx, painting);
  };

  const handlePointerEnter = (dayIdx: number, slotIdx: number) => {
    if (!dragState.current?.active || dragState.current.dayIdx !== dayIdx) return;
    toggleSlot(dayIdx, slotIdx, dragState.current.painting);
  };

  const handlePointerUp = () => {
    if (dragState.current) dragState.current.active = false;
  };

  const handleAddException = () => {
    if (!newExcDate) return;
    const exc: AvailabilityExceptionRequest = {
      date: newExcDate,
      kind: newExcKind,
      ...(newExcAllDay
        ? {}
        : { startSlot: timeToSlot(newExcStartTime), endSlot: timeToSlot(newExcEndTime) }),
    };
    setExceptions((prev) => [...prev.filter((e) => e.date !== newExcDate), exc]);
    setNewExcDate('');
  };

  const handleSave = () => {
    onSave(gridToWeeklyRules(grid, effectiveFrom, effectiveTo), note, exceptions);
  };

  if (!open) return null;

  const hourSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(
    (i) => (i + START_SLOT) % 2 === 0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerUp={handlePointerUp}
    >
      <div
        className="bg-card relative mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-xl shadow-xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-5 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-sub hover:text-foreground absolute top-4 right-4"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-foreground mb-1 text-[17px] font-bold">
            나의 스케줄 관리{' '}
            <span className="text-foreground-muted text-caption font-normal">({step}/4)</span>
          </h3>
        </div>

        {/* Step 1: 기간 선택 */}
        {step === 1 && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pt-1 pb-2">
              <p className="text-foreground-sub mb-4 text-[12px]">
                이 스케줄이 적용될 기간을 선택해주세요
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-[64px_1fr] items-center gap-3">
                  <span className="text-foreground-sub text-[13px]">시작일</span>
                  <DatePicker
                    value={effectiveFrom}
                    min={today}
                    onChange={setEffectiveFrom}
                    placeholder="시작일 선택"
                  />
                </div>
                <div className="grid grid-cols-[64px_1fr] items-center gap-3">
                  <span className="text-foreground-sub text-[13px]">종료일</span>
                  <DatePicker
                    value={effectiveTo}
                    min={effectiveFrom || today}
                    onChange={setEffectiveTo}
                    placeholder="종료일 선택 (선택)"
                  />
                </div>
                <p className="text-foreground-muted text-micro">
                  {effectiveTo
                    ? `* ${effectiveFrom} ~ ${effectiveTo} 기간에 적용됩니다`
                    : '* 종료일 미입력 시 무기한 적용됩니다'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 justify-end px-5 pt-3 pb-5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep(2)}
                disabled={!effectiveFrom}
                className="rounded-[5px]"
              >
                다음
              </Button>
            </div>
          </>
        )}

        {/* Step 2: 주간 타임테이블 */}
        {step === 2 && (
          <>
            <div className="shrink-0 px-5 pt-1">
              <p className="text-foreground-sub mb-3 text-[12px]">
                주간 가능 시간대를 모두 채워주세요
              </p>
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setGrid(emptyGrid())}
                  className="text-foreground-sub border-border text-micro rounded border px-2 py-0.5"
                >
                  스케줄 초기화
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              <div className="overflow-x-auto select-none" onPointerLeave={handlePointerUp}>
                <div className="min-w-[320px]">
                  <div className="grid" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
                    <div />
                    {DAY_SHORT.map((day, i) => (
                      <div key={i} className="flex items-center justify-center py-1">
                        <span className="text-foreground-sub text-[10px] font-medium">{day}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="relative grid"
                    style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}
                  >
                    <div className="relative">
                      {hourSlots.map((slotIdx) => (
                        <span
                          key={slotIdx}
                          className="text-foreground-muted absolute right-2 text-right text-[9px] leading-none"
                          style={{
                            top: slotIdx * CELL_HEIGHT + (slotIdx === 0 ? 7 : 0),
                            transform: 'translateY(-50%)',
                          }}
                        >
                          {slotToTimeLabel(slotIdx + START_SLOT)}
                        </span>
                      ))}
                      <span
                        className="text-foreground-muted absolute right-2 text-right text-[9px] leading-none"
                        style={{ top: SLOT_COUNT * CELL_HEIGHT - 7, transform: 'translateY(-50%)' }}
                      >
                        22:00
                      </span>
                      <div style={{ height: SLOT_COUNT * CELL_HEIGHT }} />
                    </div>

                    {Array.from({ length: 7 }, (_, dayIdx) => (
                      <div
                        key={dayIdx}
                        className="border-border relative border-l"
                        style={{ height: SLOT_COUNT * CELL_HEIGHT }}
                      >
                        {hourSlots.map((slotIdx) => (
                          <div
                            key={slotIdx}
                            className="border-border absolute right-0 left-0 border-t"
                            style={{ top: slotIdx * CELL_HEIGHT }}
                          />
                        ))}
                        {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => (
                          <div
                            key={slotIdx}
                            className={cn(
                              'absolute right-0 left-0 cursor-pointer transition-colors',
                              grid[dayIdx]![slotIdx] ? 'bg-[#e8856a]' : 'hover:bg-[#e8856a]/20',
                            )}
                            style={{ top: slotIdx * CELL_HEIGHT, height: CELL_HEIGHT }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              handlePointerDown(dayIdx, slotIdx);
                            }}
                            onPointerEnter={() => handlePointerEnter(dayIdx, slotIdx)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-5 pb-5">
              <p className="text-foreground-muted text-micro mt-2.5">* 셀 1칸 당 30분 단위입니다</p>
              <p className="text-foreground-muted text-micro">
                * 입력한 주간 가능 시간대는 향후 전 주 동일 적용됩니다
              </p>
              <div className="mt-4 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="rounded-[5px]"
                >
                  이전
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep(3)}
                  disabled={!hasAnySelected(grid)}
                  className="rounded-[5px]"
                >
                  다음
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: 예외 날짜 */}
        {step === 3 && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 pt-1 pb-2">
              <p className="text-foreground-sub text-[12px]">
                위 규칙과 다른 날짜가 있으면 추가해주세요 (선택)
              </p>

              {/* 추가 폼 */}
              <div className="border-border space-y-3 rounded-md border p-3">
                <div className="grid grid-cols-[52px_1fr] items-center gap-2">
                  <span className="text-foreground-sub text-[12px]">날짜</span>
                  <DatePicker
                    value={newExcDate}
                    min={effectiveFrom}
                    max={effectiveTo || undefined}
                    onChange={setNewExcDate}
                    placeholder="날짜 선택"
                  />
                </div>
                <div className="grid grid-cols-[52px_1fr] items-center gap-2">
                  <span className="text-foreground-sub text-[12px]">종류</span>
                  <div className="flex gap-4">
                    {(['AVAILABLE', 'BLOCKED'] as AvailabilityKind[]).map((k) => (
                      <label key={k} className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="radio"
                          name="excKind"
                          value={k}
                          checked={newExcKind === k}
                          onChange={() => setNewExcKind(k)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border-2',
                            newExcKind === k ? 'border-[#d1d5db]' : 'border-[#6b7280]',
                          )}
                        >
                          {newExcKind === k && (
                            <span className="h-2 w-2 rounded-full bg-[#d1d5db]" />
                          )}
                        </span>
                        <span
                          className={cn(
                            'text-[12px]',
                            newExcKind === k ? 'text-[#d1d5db]' : 'text-[#6b7280]',
                          )}
                        >
                          {k === 'AVAILABLE' ? '가능' : '불가'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[52px_1fr] items-center gap-2">
                  <span className="text-foreground-sub text-[12px]">시간</span>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={newExcAllDay}
                      onChange={(e) => setNewExcAllDay(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border-2',
                        newExcAllDay ? 'border-[#d1d5db] bg-[#d1d5db]' : 'border-[#6b7280]',
                      )}
                    >
                      {newExcAllDay && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                    </span>
                    <span
                      className={cn(
                        'text-[12px]',
                        newExcAllDay ? 'text-[#d1d5db]' : 'text-foreground',
                      )}
                    >
                      하루 종일
                    </span>
                  </label>
                </div>
                {!newExcAllDay && (
                  <div className="grid grid-cols-[52px_1fr] items-center gap-2">
                    <div />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={newExcStartTime}
                          min="09:00"
                          max="22:00"
                          step={1800}
                          onChange={(e) => setNewExcStartTime(e.target.value)}
                          className="border-border bg-surface rounded-md border px-2 py-1.5 text-[12px] text-[#d1d5db]"
                        />
                        <span className="text-foreground-muted text-[12px]">~</span>
                        <input
                          type="time"
                          value={newExcEndTime}
                          min="09:00"
                          max="22:00"
                          step={1800}
                          onChange={(e) => setNewExcEndTime(e.target.value)}
                          className="border-border bg-surface rounded-md border px-2 py-1.5 text-[12px] text-[#d1d5db]"
                        />
                      </div>
                      <p className="text-foreground-muted text-[10px]">
                        * 09:00~22:00 범위 내에서만 선택 가능합니다
                      </p>
                      {(newExcStartTime < '09:00' ||
                        newExcEndTime > '22:00' ||
                        newExcStartTime >= newExcEndTime) && (
                        <p className="text-[10px] text-red-400">
                          {newExcStartTime >= newExcEndTime
                            ? '* 시작 시간은 종료 시간보다 빨라야 합니다'
                            : '* 09:00~22:00 범위를 벗어난 시간입니다'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddException}
                    disabled={
                      !newExcDate ||
                      (!newExcAllDay &&
                        (newExcStartTime < '09:00' ||
                          newExcEndTime > '22:00' ||
                          newExcStartTime >= newExcEndTime))
                    }
                    className="gap-1 rounded-[5px]"
                  >
                    <Plus className="h-3 w-3" />
                    추가
                  </Button>
                </div>
              </div>

              {/* 예외 목록 */}
              {exceptions.length > 0 && (
                <ul className="space-y-2">
                  {exceptions.map((exc) => (
                    <li
                      key={exc.date}
                      className="border-border flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <span className="text-foreground text-[13px] font-medium">{exc.date}</span>
                        <span
                          className={cn(
                            'ml-2 text-[11px]',
                            exc.kind === 'AVAILABLE' ? 'text-[#d1d5db]' : 'text-foreground-muted',
                          )}
                        >
                          {exc.kind === 'AVAILABLE' ? '가능' : '불가'}
                        </span>
                        {exc.startSlot != null && exc.endSlot != null && (
                          <span className="text-foreground-muted ml-1 text-[11px]">
                            {slotToTime(exc.startSlot)}~{slotToTime(exc.endSlot)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExceptions((prev) => prev.filter((e) => e.date !== exc.date))
                        }
                        className="text-foreground-muted hover:text-foreground"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex shrink-0 justify-between px-5 pt-3 pb-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
                className="rounded-[5px]"
              >
                이전
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep(4)}
                className="rounded-[5px]"
              >
                다음
              </Button>
            </div>
          </>
        )}

        {/* Step 4: 특이사항 */}
        {step === 4 && (
          <>
            <div className="px-5 pb-5">
              <p className="text-foreground-sub mb-3 text-[12px]">특이사항을 적어주세요</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ex) 평일 저녁만, 주말은 1시 이후부터 가능합니다."
                className="placeholder:text-foreground-muted focus-visible:border-foreground-muted h-40 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={500}
              />
              <p className="text-foreground-muted mt-1 text-right text-[12px]">
                {note.length}/500자
              </p>
              <div className="mt-3 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(3)}
                  className="rounded-[5px]"
                >
                  이전
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  loading={isSaving}
                  className="rounded-[5px]"
                >
                  완료
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
