'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

import type { PerformanceListItemResponse } from '@/domain/performance/types';
import type { PracticeListItemResponse } from '@/domain/practice/types';
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
  weekDates: Date[],
): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: 7 }, () =>
    new Array<boolean>(SLOT_COUNT).fill(false),
  );

  for (const rule of rules) {
    const dayIdx = DAY_OF_WEEK_KEYS.indexOf(rule.dayOfWeek);
    if (dayIdx === -1) continue;
    const weekDate = weekDates[dayIdx];
    if (!weekDate) continue;
    const dateStr = format(weekDate, 'yyyy-MM-dd');
    if (rule.effectiveTo && dateStr > rule.effectiveTo) continue;
    if (dateStr < rule.effectiveFrom) continue;

    const row = matrix[dayIdx]!;
    for (let s = rule.startSlot; s < rule.endSlot; s++) {
      const idx = s - START_SLOT;
      if (idx >= 0 && idx < SLOT_COUNT) row[idx] = true;
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

function buildEvents(
  practices: PracticeListItemResponse[],
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
  practices: PracticeListItemResponse[];
  performances: PerformanceListItemResponse[];
  onManageSchedule: () => void;
};

export function WeeklyTimetable({
  availability,
  practices,
  performances,
  onManageSchedule,
}: Props) {
  const now = toZonedTime(new Date(), KST);
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const weekLabel =
    format(weekDates[0]!, 'yyyy-MM-dd (EEE)', { locale: ko }) +
    ' ~ ' +
    format(weekDates[6]!, 'MM-dd (EEE)', { locale: ko });

  const availMatrix = buildAvailabilityMatrix(availability?.weeklyRules ?? [], weekDates);
  const events = buildEvents(practices, performances, weekDates);

  const eventsByDay: TimetableEvent[][] = Array.from({ length: 7 }, () => []);
  for (const ev of events) eventsByDay[ev.dayIdx]!.push(ev);

  const hourSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(
    (i) => (i + START_SLOT) % 2 === 0,
  );

  return (
    <section className="mt-15">
      <div className="mb-s-3 flex items-center justify-between">
        <h2 className="text-foreground text-[18px] font-bold">주간 타임테이블</h2>
        <button
          type="button"
          onClick={onManageSchedule}
          className="text-foreground border-border rounded-[5px] border px-3 py-1 text-[13px] font-medium"
        >
          나의 스케줄 관리
        </button>
      </div>

      <p className="text-foreground-sub mb-3 text-center text-[13px]">{weekLabel}</p>

      <div className="border-border overflow-x-auto rounded-md border">
        <div className="min-w-[360px]">
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
                  className="text-foreground-muted absolute right-0 left-0 pr-1 text-right text-[9px] leading-none"
                  style={{
                    top: slotIdx * CELL_HEIGHT,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {slotToHourLabel(slotIdx + START_SLOT)}
                </span>
              ))}
              <div style={{ height: SLOT_COUNT * CELL_HEIGHT }} />
            </div>

            {/* 요일별 컬럼 */}
            {weekDates.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className="border-border relative border-r last:border-r-0"
                style={{ height: SLOT_COUNT * CELL_HEIGHT }}
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
                    className="bg-surface/70 absolute right-0 left-0"
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
                      className={cn(
                        'absolute right-0 left-0 overflow-hidden rounded-sm px-1 py-0.5',
                        ev.type === 'practice'
                          ? 'bg-[#e8e8c0] text-[#4a4a20]'
                          : 'bg-[#7a9e8c] text-white',
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
