'use client';

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useMyPerformances } from '@/domain/performance/hooks/useMyPerformances';
import type { PerformanceListItemResponse } from '@/domain/performance/types';
import { useMyJams } from '@/domain/jam/hooks/useMyJams';
import type { JamListItemResponse } from '@/domain/jam/types';
import { cn } from '@/lib/cn';
import { KST } from '@/lib/date';

import { useMyAvailabilitySlots } from '../hooks/useMyAvailabilitySlots';
import type { MemberAvailabilityResponse, ScheduleSlotResponse } from '../types';

const START_SLOT = 0; // 0시
const END_SLOT = 48; // 24시
const SLOT_COUNT = END_SLOT - START_SLOT;
const CELL_HEIGHT = 16; // px per 30-min slot

const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_KO = ['월', '화', '수', '목', '금', '토', '일'];

const DAY_OF_WEEK_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

function slotToHourLabel(slot: number): string {
  return `${Math.floor(slot / 2)}`;
}

function slotToTimeStr(slot: number): string {
  const h = Math.floor(slot / 2)
    .toString()
    .padStart(2, '0');
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

type InfoFilter = 'weekly' | 'exception' | 'practice' | 'performance';

const INFO_FILTERS: { key: InfoFilter; label: string }[] = [
  { key: 'weekly', label: '위클리 규칙' },
  { key: 'exception', label: '예외' },
  { key: 'practice', label: '합주' },
  { key: 'performance', label: '공연' },
];

/** 미니 월 달력 — 오늘 표시, 조회 중인 주 하이라이트, 합주/공연 있는 날 원형 표시, 월 이동/날짜 클릭 지원. */
function MiniMonthCalendar({
  monthAnchor,
  today,
  viewedWeekDateStrs,
  jamDateStrs,
  performanceDateStrs,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: {
  monthAnchor: Date;
  today: string;
  viewedWeekDateStrs: Set<string>;
  jamDateStrs: Set<string>;
  performanceDateStrs: Set<string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
}) {
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const leadingBlanks = (monthStart.getDay() + 6) % 7; // 0=Mon..6=Sun
  const daysInMonth = monthEnd.getDate();
  const totalCells = leadingBlanks + daysInMonth;
  const rowCount = Math.ceil(totalCells / 7);

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i)),
  ];
  while (cells.length < rowCount * 7) cells.push(null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-foreground text-sm font-bold">{format(monthAnchor, 'yyyy년 M월')}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="text-foreground-sub hover:text-foreground"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="text-foreground-sub hover:text-foreground"
            aria-label="다음 달"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {DAY_SHORT.map((d) => (
          <div key={d} className="text-foreground-muted py-1 text-center text-[10px] font-medium">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="h-9" />;
          const dateStr = format(date, 'yyyy-MM-dd');
          const isToday = dateStr === today;
          const isViewedWeek = viewedWeekDateStrs.has(dateStr);
          const hasJam = jamDateStrs.has(dateStr);
          const hasPerformance = performanceDateStrs.has(dateStr);
          const col = i % 7;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                'flex h-9 items-center justify-center',
                isViewedWeek && 'bg-white/5',
                isViewedWeek && col === 0 && 'rounded-l-[5px]',
                isViewedWeek && col === 6 && 'rounded-r-[5px]',
              )}
            >
              <div className="relative flex h-7 w-7 items-center justify-center">
                {hasPerformance && (
                  <span
                    className={cn(
                      'absolute rounded-full border-[1.5px] border-[#60a5fa]',
                      hasJam ? 'h-7 w-7' : 'h-6 w-6',
                    )}
                  />
                )}
                {hasJam && (
                  <span
                    className={cn(
                      'absolute rounded-full border-[1.5px] border-[#4ade80]',
                      hasPerformance ? 'h-5 w-5' : 'h-6 w-6',
                    )}
                  />
                )}
                {isToday && <span className="absolute h-5 w-5 rounded-full bg-[#f87171]" />}
                <span
                  className={cn(
                    'relative text-[13px]',
                    isToday ? 'font-bold text-white' : 'text-foreground',
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 필터 버튼 + 하단 정보 상자 — 표시 내용은 조회 중인 주(weekDates)에 맞춰 달라진다. */
function ScheduleInfoBox({
  weekDates,
  availability,
  practices,
  performances,
}: {
  weekDates: Date[];
  availability: MemberAvailabilityResponse | undefined;
  practices: JamListItemResponse[];
  performances: PerformanceListItemResponse[];
}) {
  const [filter, setFilter] = useState<InfoFilter>('weekly');

  const weekFrom = format(weekDates[0]!, 'yyyy-MM-dd');
  const weekTo = format(weekDates[6]!, 'yyyy-MM-dd');

  const weeklyRules = availability?.weeklyRules ?? [];
  // 이 주가 규칙 적용 기간(effectiveFrom~effectiveTo) 안에 들어오는지로 필터.
  const activeWeeklyRules = weeklyRules.filter((r) => {
    if (r.effectiveFrom > weekTo) return false;
    if (r.effectiveTo && r.effectiveTo < weekFrom) return false;
    return true;
  });
  const exceptions = (availability?.exceptions ?? []).filter(
    (e) => e.date >= weekFrom && e.date <= weekTo,
  );

  type DayKey = (typeof DAY_OF_WEEK_ORDER)[number];
  const rulesByDay = DAY_OF_WEEK_ORDER.reduce(
    (acc, day) => {
      acc[day] = activeWeeklyRules.filter((r) => r.dayOfWeek === day);
      return acc;
    },
    {} as Record<DayKey, typeof activeWeeklyRules>,
  );

  return (
    <div>
      {/* 필터 버튼 */}
      <div className="mb-2 flex gap-1.5">
        {INFO_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              filter === key
                ? 'border-foreground text-foreground'
                : 'border-border text-foreground-muted hover:text-foreground-sub',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 정보 상자 */}
      <div
        className={cn(
          'border-border rounded-md border py-2',
          filter !== 'weekly' && 'divide-border divide-y',
        )}
        style={{ minHeight: 120, backgroundColor: '#323244' }}
      >
        {filter === 'weekly' &&
          (activeWeeklyRules.length === 0 ? (
            <p className="text-foreground-muted px-3 py-3 text-xs">
              이 주에 적용되는 규칙이 없습니다.
            </p>
          ) : (
            DAY_OF_WEEK_ORDER.map((day, i) => {
              const rules = rulesByDay[day] ?? [];
              return (
                <div key={day} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                  <span
                    className={cn(
                      'w-4 shrink-0 font-medium',
                      i === 5 ? 'text-[#60a5fa]' : i === 6 ? 'text-[#f87171]' : 'text-foreground',
                    )}
                  >
                    {DAY_KO[i]}
                  </span>
                  <span className="text-foreground-muted shrink-0">|</span>
                  <span className="text-foreground-sub flex-1">
                    {rules.length === 0 ? (
                      <span className="text-foreground-muted">-</span>
                    ) : (
                      rules.map((r, ri) => (
                        <span key={ri}>
                          {ri > 0 && <span className="text-foreground-muted mx-1">·</span>}
                          {slotToTimeStr(r.startSlot)}~{slotToTimeStr(r.endSlot)}
                        </span>
                      ))
                    )}
                  </span>
                </div>
              );
            })
          ))}

        {filter === 'exception' &&
          (exceptions.length === 0 ? (
            <p className="text-foreground-muted px-3 py-3 text-xs">
              이 주에 등록된 예외 날짜가 없습니다.
            </p>
          ) : (
            exceptions.map((exc, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className="text-foreground w-20 shrink-0 font-medium">{exc.date}</span>
                <span
                  className={cn(
                    'shrink-0 font-medium',
                    exc.kind === 'AVAILABLE' ? 'text-foreground' : 'text-foreground-muted',
                  )}
                >
                  {exc.kind === 'AVAILABLE' ? '가능' : '불가'}
                </span>
                <span className="text-foreground-muted flex-1 text-right">
                  {exc.startSlot != null && exc.endSlot != null
                    ? `${slotToTimeStr(exc.startSlot)}~${slotToTimeStr(exc.endSlot)}`
                    : '하루 종일'}
                </span>
              </div>
            ))
          ))}

        {filter === 'practice' &&
          (practices.length === 0 ? (
            <p className="text-foreground-muted px-3 py-3 text-xs">
              이 주에 예정된 합주가 없습니다.
            </p>
          ) : (
            practices.map((p, i) => {
              const [date, time] = p.startAt.split(' ');
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                  <span className="text-foreground min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="text-foreground-muted shrink-0">
                    {date} {time?.slice(0, 5)}
                  </span>
                </div>
              );
            })
          ))}

        {filter === 'performance' &&
          (performances.length === 0 ? (
            <p className="text-foreground-muted px-3 py-3 text-xs">
              이 주에 예정된 공연이 없습니다.
            </p>
          ) : (
            performances.map((p, i) => {
              const [date, time] = p.startAt.split(' ');
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                  <span className="text-foreground min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="text-foreground-muted shrink-0">
                    {date} {time?.slice(0, 5)}
                  </span>
                </div>
              );
            })
          ))}
      </div>
    </div>
  );
}

function startAtToSlot(startAt: string): number {
  const spaceIdx = startAt.indexOf(' ');
  const time = spaceIdx !== -1 ? startAt.slice(spaceIdx + 1) : '00:00';
  const colonIdx = time.indexOf(':');
  const h = colonIdx !== -1 ? parseInt(time.slice(0, colonIdx), 10) : 0;
  const m = colonIdx !== -1 ? parseInt(time.slice(colonIdx + 1), 10) : 0;
  return h * 2 + (m >= 30 ? 1 : 0);
}

function slotsToMatrix(slots: ScheduleSlotResponse[], weekDates: Date[]): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: 7 }, () =>
    new Array<boolean>(SLOT_COUNT).fill(false),
  );
  const weekDateStrs = weekDates.map((d) => format(d, 'yyyy-MM-dd'));

  for (const slot of slots) {
    if (slot.type !== 'AVAILABLE') continue;
    const dayIdx = weekDateStrs.indexOf(slot.date);
    if (dayIdx === -1) continue;
    const row = matrix[dayIdx]!;
    for (let s = slot.startSlot; s < slot.endSlot; s++) {
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
  onManageSchedule: () => void;
};

export function WeeklyTimetable({ availability, onManageSchedule }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  // 미니 달력의 월 이동은 조회 중인 주와 별개로 독립적으로 탐색 가능 — 단, 주가 바뀌면
  // (좌우 주간 이동이든 달력 내 날짜 클릭이든) 다시 그 주가 속한 달을 기준으로 리셋된다.
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  // 요일 박스/미니 달력에서 클릭해 선택한 날짜 — 기본값은 오늘.
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    format(toZonedTime(new Date(), KST), 'yyyy-MM-dd'),
  );

  const now = toZonedTime(new Date(), KST);
  const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), weekOffset * 7);
  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  useEffect(() => {
    setCalendarMonthOffset(0);
  }, [weekOffset]);

  const calendarMonthAnchor = addMonths(startOfMonth(monday), calendarMonthOffset);

  const handleSelectDate = (date: Date) => {
    const targetMonday = startOfWeek(date, { weekStartsOn: 1 });
    const baseMonday = startOfWeek(now, { weekStartsOn: 1 });
    const diffDays = differenceInCalendarDays(targetMonday, baseMonday);
    setWeekOffset(Math.round(diffDays / 7));
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  const from = format(weekDates[0]!, 'yyyy-MM-dd');
  const to = format(weekDates[6]!, 'yyyy-MM-dd');
  const { data: slots } = useMyAvailabilitySlots(from, to);

  // 조회 중인 주간(from~to)으로 범위를 좁혀 합주/공연 목록을 가져옴.
  const { data: jamsData } = useMyJams(50, { from, to });
  const { data: performancesData } = useMyPerformances(50, { from, to });
  const practices: JamListItemResponse[] = jamsData?.pages.flatMap((p) => p.content) ?? [];
  const performances: PerformanceListItemResponse[] =
    performancesData?.pages.flatMap((p) => p.content) ?? [];

  // 미니 달력에 표시할 월 전체 범위 — 달력에서 독립적으로 이동 중인 달 기준.
  const monthStart = format(startOfMonth(calendarMonthAnchor), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(calendarMonthAnchor), 'yyyy-MM-dd');
  const { data: monthJamsData } = useMyJams(100, { from: monthStart, to: monthEnd });
  const { data: monthPerformancesData } = useMyPerformances(100, {
    from: monthStart,
    to: monthEnd,
  });
  const jamDateStrs = new Set(
    (monthJamsData?.pages.flatMap((p) => p.content) ?? []).map((p) => p.startAt.split(' ')[0]!),
  );
  const performanceDateStrs = new Set(
    (monthPerformancesData?.pages.flatMap((p) => p.content) ?? []).map(
      (p) => p.startAt.split(' ')[0]!,
    ),
  );
  const viewedWeekDateStrs = new Set(weekDates.map((d) => format(d, 'yyyy-MM-dd')));
  const todayStr = format(now, 'yyyy-MM-dd');

  const weekLabel =
    format(weekDates[0]!, 'yyyy-MM-dd (EEE)', { locale: ko }) +
    ' ~ ' +
    format(weekDates[6]!, 'MM-dd (EEE)', { locale: ko });

  const neverSet = !availability || availability.updatedAt === null;
  const availMatrix = neverSet
    ? Array.from({ length: 7 }, () => new Array<boolean>(SLOT_COUNT).fill(true))
    : slotsToMatrix(slots ?? [], weekDates);

  const events = buildEvents(practices, performances, weekDates);
  const eventsByDay: TimetableEvent[][] = Array.from({ length: 7 }, () => []);
  for (const ev of events) eventsByDay[ev.dayIdx]!.push(ev);

  const hourSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(
    (i) => (i + START_SLOT) % 2 === 0,
  );

  return (
    <section>
      <div className="mb-s-3 relative flex min-h-8 items-center justify-end">
        <button
          type="button"
          onClick={onManageSchedule}
          className="text-foreground shrink-0 rounded-[5px] border border-white px-3 py-1 text-sm font-medium"
        >
          나의 스케줄 관리
        </button>
      </div>

      <div className="gap-s-6 flex flex-col lg:flex-row">
        {/* 좌측: 미니 달력 + 필터 정보 상자 */}
        <div className="w-full shrink-0 lg:w-64">
          <MiniMonthCalendar
            monthAnchor={calendarMonthAnchor}
            today={todayStr}
            viewedWeekDateStrs={viewedWeekDateStrs}
            jamDateStrs={jamDateStrs}
            performanceDateStrs={performanceDateStrs}
            onPrevMonth={() => setCalendarMonthOffset((o) => o - 1)}
            onNextMonth={() => setCalendarMonthOffset((o) => o + 1)}
            onSelectDate={handleSelectDate}
          />
          <div className="mt-s-4">
            <ScheduleInfoBox
              weekDates={weekDates}
              availability={availability}
              practices={practices}
              performances={performances}
            />
          </div>
        </div>

        {/* 우측: 주간 네비 + 합주/공연 토글 + 시간 그리드 */}
        <div className="min-w-0 flex-1">
          <div className="py-s-4 pr-s-4 pl-s-2 rounded-[8px] border border-white">
            <div className="mb-s-3 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setWeekOffset((o) => o - 1)}
                className="text-foreground-sub hover:text-foreground"
                aria-label="이전 주"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-foreground-sub mx-2 text-sm">{weekLabel}</p>
              <button
                type="button"
                onClick={() => setWeekOffset((o) => o + 1)}
                className="text-foreground-sub hover:text-foreground"
                aria-label="다음 주"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-md">
              {/* 요일 헤더 */}
              <div
                className="grid gap-x-2 pb-3"
                style={{ gridTemplateColumns: '20px repeat(7, minmax(0, 1fr)) 16px' }}
              >
                <div />
                {weekDates.map((d, i) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const isSelected = dateStr === selectedDate;
                  const isSat = i === 5;
                  const isSun = i === 6;
                  // 주말은 선택 시 더 어두운 톤으로, 평일은 선택 시 요일 텍스트를 밝게(회색 배경 위에서 잘 안 보이던 문제).
                  const weekendColor = isSat
                    ? isSelected
                      ? '#2563eb'
                      : '#60a5fa'
                    : isSun
                      ? isSelected
                        ? '#dc2626'
                        : '#f87171'
                      : null;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className="relative rounded-lg px-3 py-2.5 text-left"
                      style={{ backgroundColor: isSelected ? '#85859980' : '#323244' }}
                    >
                      <span
                        className={cn(
                          'text-xl font-bold',
                          weekendColor === null && 'text-foreground',
                        )}
                        style={weekendColor ? { color: weekendColor } : undefined}
                      >
                        {d.getDate()}
                      </span>
                      <span
                        className={cn(
                          'text-micro absolute right-2.5 bottom-2 font-medium',
                          weekendColor === null &&
                            (isSelected ? 'text-foreground' : 'text-foreground-muted'),
                        )}
                        style={weekendColor ? { color: weekendColor } : undefined}
                      >
                        {DAY_KO[i]}
                      </span>
                    </button>
                  );
                })}
                <div />
              </div>

              {/* 시간 그리드 */}
              <div
                className="relative grid gap-x-2"
                style={{ gridTemplateColumns: '20px repeat(7, minmax(0, 1fr)) 16px' }}
              >
                {/* 시간 레이블 */}
                <div className="relative">
                  {hourSlots.map((slotIdx) => (
                    <span
                      key={slotIdx}
                      className="text-foreground-muted absolute right-2 text-right text-[9px] leading-none whitespace-nowrap"
                      style={{
                        top: slotIdx * CELL_HEIGHT + (slotIdx === 0 ? 7 : 0),
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {slotToHourLabel(slotIdx + START_SLOT)}
                    </span>
                  ))}
                  <span
                    className="text-foreground-muted absolute right-2 text-right text-[9px] leading-none whitespace-nowrap"
                    style={{ top: SLOT_COUNT * CELL_HEIGHT - 9, transform: 'translateY(-50%)' }}
                  >
                    24
                  </span>
                  <div style={{ height: SLOT_COUNT * CELL_HEIGHT }} />
                </div>

                {/* 요일별 컬럼 */}
                {weekDates.map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="relative"
                    style={{ height: SLOT_COUNT * CELL_HEIGHT }}
                  >
                    {/* 30분 단위 가로줄 */}
                    {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => (
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
                        className="bg-foreground-sub/40 absolute right-0 left-0 rounded-[5px]"
                        style={{
                          top: block.start * CELL_HEIGHT,
                          height: block.length * CELL_HEIGHT,
                        }}
                      />
                    ))}

                    {/* 합주/공연 이벤트 블록 */}
                    {eventsByDay[dayIdx]!.map((ev, ei) => {
                      const clippedStart = Math.max(0, ev.startSlot);
                      const clippedEnd = Math.min(SLOT_COUNT, ev.startSlot + ev.slotSpan);
                      const height = Math.max(
                        CELL_HEIGHT,
                        (clippedEnd - clippedStart) * CELL_HEIGHT,
                      );
                      return (
                        <div
                          key={ei}
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
                  </div>
                ))}
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
