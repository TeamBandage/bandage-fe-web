'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { KST } from '@/lib/date';
import { cn } from '@/lib/cn';
import { toZonedTime } from 'date-fns-tz';

import type { DayOfWeek, MemberAvailabilityResponse, WeeklyRuleRequest } from '../types';

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

// 모달 표시 범위: 9:00(slot 18) ~ 22:30(slot 45) — 선택 가능한 마지막 시작 슬롯 포함
const START_SLOT = 18;
const END_SLOT = 45;
const SLOT_COUNT = END_SLOT - START_SLOT; // 27슬롯

const CELL_HEIGHT = 22; // px

function slotToTimeLabel(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

/** [dayIdx][slotIdx] = selected? */
type GridState = boolean[][];

function emptyGrid(): GridState {
  return Array.from({ length: 7 }, () => Array(SLOT_COUNT).fill(false));
}

function availabilityToGrid(availability: MemberAvailabilityResponse | undefined): GridState {
  const grid = emptyGrid();
  if (!availability) return grid;

  const now = toZonedTime(new Date(), KST);
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const weekDateStrs = weekDates.map((d) => format(d, 'yyyy-MM-dd'));

  for (const rule of availability.weeklyRules) {
    const dayIdx = DAY_OF_WEEK_KEYS.indexOf(rule.dayOfWeek);
    if (dayIdx === -1) continue;
    const dateStr = weekDateStrs[dayIdx];
    if (!dateStr) continue;
    if (rule.effectiveTo && dateStr > rule.effectiveTo) continue;
    if (dateStr < rule.effectiveFrom) continue;

    for (let s = rule.startSlot; s < rule.endSlot; s++) {
      const idx = s - START_SLOT;
      if (idx >= 0 && idx < SLOT_COUNT) grid[dayIdx]![idx] = true;
    }
  }
  return grid;
}

function gridToWeeklyRules(grid: GridState): WeeklyRuleRequest[] {
  const rules: WeeklyRuleRequest[] = [];
  const now = toZonedTime(new Date(), KST);
  const monday = startOfWeek(now, { weekStartsOn: 1 });

  for (let d = 0; d < 7; d++) {
    const dayOfWeek = DAY_OF_WEEK_KEYS[d];
    if (!dayOfWeek) continue;
    const dayDate = addDays(monday, d);
    const effectiveFrom = format(dayDate, 'yyyy-MM-dd');
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
  onSave: (weeklyRules: WeeklyRuleRequest[], note: string) => void;
  isSaving?: boolean;
};

export function ScheduleManagerModal({ open, onClose, availability, onSave, isSaving }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [grid, setGrid] = useState<GridState>(emptyGrid);
  const [note, setNote] = useState('');

  // 드래그 상태
  const dragState = useRef<{
    active: boolean;
    dayIdx: number;
    painting: boolean; // true=선택, false=해제
    startSlot: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setGrid(availabilityToGrid(availability));
      setNote(availability?.note ?? '');
    }
  }, [open, availability]);

  const toggleSlot = useCallback((dayIdx: number, slotIdx: number, paint: boolean) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[dayIdx]![slotIdx] = paint;
      return next;
    });
  }, []);

  const handlePointerDown = (dayIdx: number, slotIdx: number) => {
    const painting = !grid[dayIdx]![slotIdx];
    dragState.current = { active: true, dayIdx, painting, startSlot: slotIdx };
    toggleSlot(dayIdx, slotIdx, painting);
  };

  const handlePointerEnter = (dayIdx: number, slotIdx: number) => {
    if (!dragState.current?.active || dragState.current.dayIdx !== dayIdx) return;
    toggleSlot(dayIdx, slotIdx, dragState.current.painting);
  };

  const handlePointerUp = () => {
    if (dragState.current) dragState.current.active = false;
  };

  const handleReset = () => setGrid(emptyGrid());

  const handleNext = () => setStep(2);

  const handleSave = () => {
    const rules = gridToWeeklyRules(grid);
    onSave(rules, note);
  };

  if (!open) return null;

  const weekDates = (() => {
    const now = toZonedTime(new Date(), KST);
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  })();

  const hourSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(
    (i) => (i + START_SLOT) % 2 === 0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerUp={handlePointerUp}
    >
      <div className="bg-card relative mx-4 w-full max-w-lg rounded-xl p-5 shadow-xl">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="text-foreground-sub hover:text-foreground absolute top-4 right-4"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 제목 */}
        <h3 className="text-foreground mb-1 text-[17px] font-bold">
          나의 스케줄 관리{' '}
          <span className="text-foreground-muted text-[13px] font-normal">({step}/2)</span>
        </h3>

        {step === 1 ? (
          <>
            <p className="text-foreground-sub mb-3 text-[12px]">
              주간 가능 시간대를 모두 채워주세요
            </p>

            {/* 초기화 버튼 */}
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="text-foreground-muted border-border rounded border px-2 py-0.5 text-[11px]"
              >
                스케줄 초기화
              </button>
            </div>

            {/* 선택 그리드 */}
            <div className="overflow-x-auto select-none" onPointerLeave={handlePointerUp}>
              <div className="min-w-[320px]">
                {/* 요일 헤더 */}
                <div className="grid" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
                  <div />
                  {weekDates.map((d, i) => (
                    <div key={i} className="flex flex-col items-center py-1">
                      <span className="text-foreground-sub text-[10px] font-medium">
                        {DAY_SHORT[i]}
                      </span>
                      <span className="text-foreground-muted text-[10px]">
                        {format(d, 'MM-dd')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 슬롯 그리드 */}
                <div
                  className="relative grid"
                  style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}
                >
                  {/* 시간 레이블 */}
                  <div className="relative">
                    {hourSlots.map((slotIdx) => (
                      <div
                        key={slotIdx}
                        className="absolute right-0 left-0"
                        style={{ top: slotIdx * CELL_HEIGHT }}
                      >
                        <span className="text-foreground-muted absolute -top-2 left-0 text-[9px]">
                          {slotToTimeLabel(slotIdx + START_SLOT)}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: SLOT_COUNT * CELL_HEIGHT }} />
                  </div>

                  {/* 요일별 슬롯 */}
                  {Array.from({ length: 7 }, (_, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="border-border relative border-l"
                      style={{ height: SLOT_COUNT * CELL_HEIGHT }}
                    >
                      {/* 수평 구분선 */}
                      {hourSlots.map((slotIdx) => (
                        <div
                          key={slotIdx}
                          className="border-border absolute right-0 left-0 border-t"
                          style={{ top: slotIdx * CELL_HEIGHT }}
                        />
                      ))}

                      {/* 슬롯 셀 */}
                      {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => (
                        <div
                          key={slotIdx}
                          className={cn(
                            'absolute right-0 left-0 cursor-pointer transition-colors',
                            grid[dayIdx]![slotIdx] ? 'bg-[#e8856a]' : 'hover:bg-[#e8856a]/20',
                          )}
                          style={{
                            top: slotIdx * CELL_HEIGHT,
                            height: CELL_HEIGHT,
                          }}
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

            <p className="text-foreground-muted mt-2 text-[11px]">* 셀 1칸 당 30분 단위입니다</p>
            <p className="text-foreground-muted text-[11px]">
              * 입력한 주간 가능 시간대는 향후 전 주 동일 적용됩니다
            </p>

            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={!hasAnySelected(grid)}
                className="rounded-[5px]"
              >
                다음
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-foreground-sub mb-3 text-[12px]">특이사항을 적어주세요</p>

            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="평일 저녁만, 주말은 1시 이후부터 가능합니다."
              className="h-40 resize-none"
              maxLength={500}
            />

            <div className="mt-4 flex justify-end">
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
          </>
        )}
      </div>
    </div>
  );
}
