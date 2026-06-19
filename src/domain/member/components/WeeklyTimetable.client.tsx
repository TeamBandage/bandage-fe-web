'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import type { PerformanceListItemResponse } from '@/domain/performance/types';
import type { JamListItemResponse } from '@/domain/jam/types';
import { cn } from '@/lib/cn';
import { KST } from '@/lib/date';

import type { DayOfWeek, MemberAvailabilityResponse } from '../types';

const START_SLOT = 18; // 9:00
const END_SLOT = 44; // 22:00
const SLOT_COUNT = END_SLOT - START_SLOT;
const CELL_HEIGHT = 20; // px per 30-min slot

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

function slotToHourLabel(slot: number): string {
  return `${Math.floor(slot / 2)}:00`;
}

function startAtToSlot(startAt: string): number {
  const spaceIdx = startAt.indexOf(' ');
  const time = spaceIdx !== -1 ? startAt.slice(spaceIdx + 1) : '00:00';
  const colonIdx = time.indexOf(':');
  const h = colonIdx !== -1 ? parseInt(time.slice(0, colonIdx), 10) : 0;
  const m = colonIdx !== -1 ? parseInt(time.slice(colonIdx + 1), 10) : 0;
  return h * 2 + (m >= 30 ? 1 : 0);
}

function buildAvailabilityMatrix(
  rules: MemberAvailabilityResponse['weeklyRules'],
  exceptions: MemberAvailabilityResponse['exceptions'],
  weekDates: Date[],
): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: 7 }, () =>
    new Array<boolean>(SLOT_COUNT).fill(false),
  );

  const weekDateStrs = weekDates.map((d) => format(d, 'yyyy-MM-dd'));

  // effectiveFrom 이전 날짜는 빈 셀(가능/미설정)로 표시
  const earliestFrom = rules.reduce<string | null>(
    (min, r) =>
      r.effectiveFrom && (min === null || r.effectiveFrom < min) ? r.effectiveFrom : min,
    null,
  );
  if (earliestFrom) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateStr = weekDateStrs[dayIdx];
      if (dateStr && dateStr < earliestFrom) matrix[dayIdx]!.fill(true);
    }
  }

  // weeklyRules 적용
  for (const rule of rules) {
    const dayIdx = DAY_OF_WEEK_KEYS.indexOf(rule.dayOfWeek);
    if (dayIdx === -1) continue;
    const dateStr = weekDateStrs[dayIdx];
    if (!dateStr) continue;
    if (!rule.effectiveFrom || dateStr < rule.effectiveFrom) continue;
    if (rule.effectiveTo && dateStr > rule.effectiveTo) continue;

    const row = matrix[dayIdx]!;
    for (let s = rule.startSlot; s < rule.endSlot; s++) {
      const idx = s - START_SLOT;
      if (idx >= 0 && idx < SLOT_COUNT) row[idx] = true;
    }
  }

  // exceptions 적용 (weeklyRules 위에 덮어쓰기)
  for (const exc of exceptions) {
    const dayIdx = weekDateStrs.indexOf(exc.date);
    if (dayIdx === -1) continue;

    const row = matrix[dayIdx]!;
    const isAvailable = exc.kind === 'AVAILABLE';
    const isAllDay = exc.startSlot == null || exc.endSlot == null || exc.startSlot >= exc.endSlot;

    if (isAllDay) {
      row.fill(isAvailable);
    } else {
      for (let s = exc.startSlot!; s < exc.endSlot!; s++) {
        const idx = s - START_SLOT;
        if (idx >= 0 && idx < SLOT_COUNT) row[idx] = isAvailable;
      }
    }
  }

  return matrix;
}

type TimetableEvent = {
  title: string;
  type: 'practice' | 'performance';
  startSlot: number;
  slotSpan: number;
  dayIdx: number;
};

type MockEvent = {
  id: number;
  type: 'practice' | 'performance';
  dayIdx: number;
  startSlot: number;
  slotSpan: number;
};

function buildEvents(
  practices: JamListItemResponse[],
  performances: PerformanceListItemResponse[],
  weekDates: Date[],
): TimetableEvent[] {
  const events: TimetableEvent[] = [];
  const weekDateStrs = weekDates.map((d) => format(d, 'yyyy-MM-dd'));

  for (const p of practices) {
    const datePart = p.startAt.split(' ')[0] ?? '';
    const dayIdx = weekDateStrs.indexOf(datePart);
    if (dayIdx === -1) continue;
    const startIdx = startAtToSlot(p.startAt) - START_SLOT;
    const slotSpan = Math.max(1, Math.ceil(p.durationMinutes / 30));
    if (startIdx + slotSpan <= 0 || startIdx >= SLOT_COUNT) continue;
    events.push({ title: p.title, type: 'practice', startSlot: startIdx, slotSpan, dayIdx });
  }

  for (const p of performances) {
    const datePart = p.startAt.split(' ')[0] ?? '';
    const dayIdx = weekDateStrs.indexOf(datePart);
    if (dayIdx === -1) continue;
    const startIdx = startAtToSlot(p.startAt) - START_SLOT;
    const slotSpan = Math.max(1, Math.ceil(p.durationMinutes / 30));
    if (startIdx + slotSpan <= 0 || startIdx >= SLOT_COUNT) continue;
    events.push({ title: p.title, type: 'performance', startSlot: startIdx, slotSpan, dayIdx });
  }

  return events;
}

function buildUnavailableBlocks(available: boolean[]): { start: number; length: number }[] {
  const blocks: { start: number; length: number }[] = [];
  let i = 0;
  while (i < available.length) {
    if (!available[i]) {
      const start = i;
      while (i < available.length && !available[i]) i++;
      blocks.push({ start, length: i - start });
    } else {
      i++;
    }
  }
  return blocks;
}

type Props = {
  availability: MemberAvailabilityResponse | undefined;
  practices: JamListItemResponse[];
  performances: PerformanceListItemResponse[];
  onManageSchedule: () => void;
};

export function WeeklyTimetable({
  availability,
  practices,
  performances,
  onManageSchedule,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [paintPractice, setPaintPractice] = useState(false);
  const [paintPerformance, setPaintPerformance] = useState(false);
  const [mockEvents, setMockEvents] = useState<MockEvent[]>([]);
  const mockIdRef = useRef(0);

  const handleCellClick = (dayIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!paintPractice && !paintPerformance) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const slot = Math.floor((e.clientY - rect.top) / CELL_HEIGHT);
    if (slot < 0 || slot >= SLOT_COUNT) return;
    setMockEvents((prev) => {
      let next = [...prev];
      for (const type of (['practice', 'performance'] as const).filter(
        (t) => (t === 'practice' && paintPractice) || (t === 'performance' && paintPerformance),
      )) {
        const existing = next.find(
          (m) => m.dayIdx === dayIdx && m.startSlot === slot && m.type === type,
        );
        if (existing) {
          next = next.filter((m) => m.id !== existing.id);
        } else {
          next = [...next, { id: mockIdRef.current++, type, dayIdx, startSlot: slot, slotSpan: 1 }];
        }
      }
      return next;
    });
  };

  const now = toZonedTime(new Date(), KST);
  const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), weekOffset * 7);
  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const weekLabel =
    format(weekDates[0]!, 'yyyy-MM-dd (EEE)', { locale: ko }) +
    ' ~ ' +
    format(weekDates[6]!, 'MM-dd (EEE)', { locale: ko });

  // updatedAt이 null이거나 availability 미로드 시 한 번도 설정한 적 없는 상태 → 전 슬롯 공백
  const neverSet = !availability || availability.updatedAt === null;
  const availMatrix = neverSet
    ? Array.from({ length: 7 }, () => new Array<boolean>(SLOT_COUNT).fill(true))
    : buildAvailabilityMatrix(availability.weeklyRules, availability.exceptions, weekDates);
  const events = buildEvents(practices, performances, weekDates);

  const eventsByDay: TimetableEvent[][] = Array.from({ length: 7 }, () => []);
  for (const ev of events) eventsByDay[ev.dayIdx]!.push(ev);

  const hourSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(
    (i) => (i + START_SLOT) % 2 === 0,
  );

  return (
    <section className="mt-15">
      <div className="mb-s-3 relative flex items-center justify-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="text-foreground-sub hover:text-foreground"
            aria-label="이전 주"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-foreground-sub text-sm">{weekLabel}</p>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            className="text-foreground-sub hover:text-foreground"
            aria-label="다음 주"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onManageSchedule}
          className="text-foreground border-border absolute right-0 shrink-0 rounded-[5px] border px-3 py-1 text-sm font-medium"
        >
          나의 스케줄 관리
        </button>
      </div>

      <div className="border-border rounded-md border">
        <div>
          {/* 요일 헤더 */}
          <div
            className="border-border grid border-b"
            style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}
          >
            <div className="border-border border-r" />
            {weekDates.map((d, i) => (
              <div
                key={i}
                className="border-border flex flex-col items-center border-r py-1 last:border-r-0"
              >
                <span className="text-foreground-sub text-[10px] font-medium">{DAY_SHORT[i]}</span>
                <span className="text-foreground-muted text-[10px]">{format(d, 'MM-dd')}</span>
              </div>
            ))}
          </div>

          {/* 시간 그리드 */}
          <div className="relative grid" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
            {/* 시간 레이블 */}
            <div className="border-border relative border-r">
              {hourSlots.map((slotIdx) => (
                <span
                  key={slotIdx}
                  className="text-foreground-muted absolute right-2 text-right text-[9px] leading-none"
                  style={{
                    top: slotIdx * CELL_HEIGHT + (slotIdx === 0 ? 7 : 0),
                    transform: 'translateY(-50%)',
                  }}
                >
                  {slotToHourLabel(slotIdx + START_SLOT)}
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

            {/* 요일별 컬럼 */}
            {weekDates.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  'border-border relative border-r last:border-r-0',
                  paintPractice || paintPerformance ? 'cursor-crosshair' : 'cursor-default',
                )}
                style={{ height: SLOT_COUNT * CELL_HEIGHT }}
                onClick={(e) => handleCellClick(dayIdx, e)}
              >
                {hourSlots.map((slotIdx) => (
                  <div
                    key={slotIdx}
                    className="border-border absolute right-0 left-0 border-t"
                    style={{ top: slotIdx * CELL_HEIGHT }}
                  />
                ))}

                {/* 불가 시간대 — 회색 블록 */}
                {buildUnavailableBlocks(availMatrix[dayIdx]!).map((block, bi) => (
                  <div
                    key={bi}
                    className="bg-foreground-sub/80 absolute right-0 left-0"
                    style={{
                      top: block.start * CELL_HEIGHT,
                      height: block.length * CELL_HEIGHT,
                    }}
                  />
                ))}

                {/* 이벤트 블록 */}
                {eventsByDay[dayIdx]!.map((ev, ei) => {
                  const clippedStart = Math.max(0, ev.startSlot);
                  const clippedEnd = Math.min(SLOT_COUNT, ev.startSlot + ev.slotSpan);
                  const height = Math.max(CELL_HEIGHT, (clippedEnd - clippedStart) * CELL_HEIGHT);
                  return (
                    <div
                      key={ei}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'absolute right-0 left-0 overflow-hidden rounded-sm px-1 py-0.5',
                        ev.type === 'practice'
                          ? 'bg-[#4ade80]/20 text-[#4ade80]'
                          : 'bg-[#60a5fa]/20 text-[#60a5fa]',
                      )}
                      style={{ top: clippedStart * CELL_HEIGHT, height }}
                    >
                      <p className="text-[9px] leading-tight font-semibold">
                        {ev.type === 'practice' ? '합주' : '공연'}
                      </p>
                      <p className="truncate text-[9px] leading-tight">{ev.title}</p>
                    </div>
                  );
                })}

                {/* 임시 이벤트 블록 */}
                {mockEvents
                  .filter(
                    (me) =>
                      me.dayIdx === dayIdx &&
                      ((me.type === 'practice' && paintPractice) ||
                        (me.type === 'performance' && paintPerformance)),
                  )
                  .map((me) => (
                    <div
                      key={me.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMockEvents((prev) => prev.filter((m) => m.id !== me.id));
                      }}
                      className={cn(
                        'absolute right-0 left-0 cursor-pointer overflow-hidden',
                        me.type === 'practice' ? 'bg-[#4ade80]/60' : 'bg-[#60a5fa]/60',
                      )}
                      style={{ top: me.startSlot * CELL_HEIGHT, height: me.slotSpan * CELL_HEIGHT }}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPaintPractice((v) => !v)}
          className={cn(
            'rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
            paintPractice
              ? 'border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]'
              : 'border-border text-foreground-muted',
          )}
        >
          합주 표시
        </button>
        <button
          type="button"
          onClick={() => setPaintPerformance((v) => !v)}
          className={cn(
            'rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
            paintPerformance
              ? 'border-[#60a5fa] bg-[#60a5fa]/10 text-[#60a5fa]'
              : 'border-border text-foreground-muted',
          )}
        >
          공연 표시
        </button>
      </div>
    </section>
  );
}
