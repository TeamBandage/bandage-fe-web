'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { PerformanceListItemResponse } from '@/domain/performance/types';
import type { JamListItemResponse } from '@/domain/jam/types';
import { cn } from '@/lib/cn';
import { KST } from '@/lib/date';

import { useMyAvailabilitySlots } from '../hooks/useMyAvailabilitySlots';
import type { MemberAvailabilityResponse, ScheduleSlotResponse } from '../types';

const START_SLOT = 18; // 9:00
const END_SLOT = 44; // 22:00
const SLOT_COUNT = END_SLOT - START_SLOT;
const CELL_HEIGHT = 20; // px per 30-min slot

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
  return `${Math.floor(slot / 2)}:00`;
}

function slotToTimeStr(slot: number): string {
  const h = Math.floor(slot / 2)
    .toString()
    .padStart(2, '0');
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

type SummaryTab = 'weekly' | 'exception' | 'schedule';

function ScheduleSummaryTabs({
  availability,
  practices,
  performances,
}: {
  availability: MemberAvailabilityResponse | undefined;
  practices: JamListItemResponse[];
  performances: PerformanceListItemResponse[];
}) {
  const [tab, setTab] = useState<SummaryTab>('weekly');

  const TABS: { key: SummaryTab; label: string }[] = [
    { key: 'weekly', label: '위클리 규칙' },
    { key: 'exception', label: '예외 날짜' },
    { key: 'schedule', label: '일정' },
  ];

  const weeklyRules = availability?.weeklyRules ?? [];
  const exceptions = availability?.exceptions ?? [];

  const allEvents = [
    ...practices.map((p) => ({ title: p.title, startAt: p.startAt, type: 'practice' as const })),
    ...performances.map((p) => ({
      title: p.title,
      startAt: p.startAt,
      type: 'performance' as const,
    })),
  ].sort((a, b) => a.startAt.localeCompare(b.startAt));

  type DayKey = (typeof DAY_OF_WEEK_ORDER)[number];
  const rulesByDay = DAY_OF_WEEK_ORDER.reduce(
    (acc, day) => {
      acc[day] = weeklyRules.filter((r) => r.dayOfWeek === day);
      return acc;
    },
    {} as Record<DayKey, typeof weeklyRules>,
  );

  return (
    <div className="border-border mb-[50px] rounded-md border">
      {/* 탭 헤더 */}
      <div className="border-border flex border-b">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === key
                ? 'text-foreground border-foreground border-b-2'
                : 'text-foreground-muted hover:text-foreground-sub',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 — 위클리는 스크롤 없이 7행 전체 표시 */}
      <div
        className="divide-border divide-y"
        style={tab !== 'weekly' ? { maxHeight: 180, overflowY: 'auto' } : undefined}
      >
        {/* 위클리 규칙 — 월~일 7행 고정 */}
        {tab === 'weekly' &&
          DAY_OF_WEEK_ORDER.map((day, i) => {
            const rules = rulesByDay[day] ?? [];
            return (
              <div key={day} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span
                  className={cn(
                    'w-5 shrink-0 font-medium',
                    i === 5 ? 'text-[#60a5fa]' : i === 6 ? 'text-[#f87171]' : 'text-foreground',
                  )}
                >
                  {DAY_KO[i]}
                </span>
                <span className="text-foreground-sub flex-1">
                  {rules.length === 0 ? (
                    <span className="text-foreground-muted">-</span>
                  ) : (
                    rules.map((r, ri) => (
                      <span key={ri}>
                        {ri > 0 && <span className="text-foreground-muted mx-1.5">·</span>}
                        {slotToTimeStr(r.startSlot)}~{slotToTimeStr(r.endSlot)}
                      </span>
                    ))
                  )}
                </span>
                {rules.length > 0 && (
                  <span className="text-foreground-muted shrink-0 text-xs">
                    {rules[0]!.effectiveFrom}
                    {rules[0]!.effectiveTo ? ` ~ ${rules[0]!.effectiveTo}` : ' ~'}
                  </span>
                )}
              </div>
            );
          })}

        {/* 예외 날짜 */}
        {tab === 'exception' &&
          (exceptions.length === 0 ? (
            <p className="text-foreground-muted px-4 py-3 text-sm">등록된 예외 날짜가 없습니다.</p>
          ) : (
            exceptions.map((exc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="text-foreground w-24 shrink-0 font-medium">{exc.date}</span>
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
                    ? `${slotToTimeStr(exc.startSlot)} ~ ${slotToTimeStr(exc.endSlot)}`
                    : '하루 종일'}
                </span>
              </div>
            ))
          ))}

        {/* 일정 */}
        {tab === 'schedule' &&
          (allEvents.length === 0 ? (
            <p className="text-foreground-muted px-4 py-3 text-sm">등록된 일정이 없습니다.</p>
          ) : (
            allEvents.map((ev, i) => {
              const [date, time] = ev.startAt.split(' ');
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                      ev.type === 'practice'
                        ? 'bg-[#4ade80]/10 text-[#4ade80]'
                        : 'bg-[#60a5fa]/10 text-[#60a5fa]',
                    )}
                  >
                    {ev.type === 'practice' ? '합주' : '공연'}
                  </span>
                  <span className="text-foreground min-w-0 flex-1 truncate">{ev.title}</span>
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
  const [showPractice, setShowPractice] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  const now = toZonedTime(new Date(), KST);
  const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), weekOffset * 7);
  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const from = format(weekDates[0]!, 'yyyy-MM-dd');
  const to = format(weekDates[6]!, 'yyyy-MM-dd');
  const { data: slots } = useMyAvailabilitySlots(from, to);

  const weekLabel =
    format(weekDates[0]!, 'yyyy-MM-dd (EEE)', { locale: ko }) +
    ' ~ ' +
    format(weekDates[6]!, 'MM-dd (EEE)', { locale: ko });

  const neverSet = !availability || availability.updatedAt === null;
  const availMatrix = neverSet
    ? Array.from({ length: 7 }, () => new Array<boolean>(SLOT_COUNT).fill(true))
    : slotsToMatrix(slots ?? [], weekDates);

  const events = buildEvents(
    showPractice ? practices : [],
    showPerformance ? performances : [],
    weekDates,
  );
  const eventsByDay: TimetableEvent[][] = Array.from({ length: 7 }, () => []);
  for (const ev of events) eventsByDay[ev.dayIdx]!.push(ev);

  const hourSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(
    (i) => (i + START_SLOT) % 2 === 0,
  );

  return (
    <section className="mt-15">
      <div className="mb-s-3 relative flex min-h-8 items-center">
        <h2 className="text-foreground-sub text-title flex-1 font-bold">스케줄 정보</h2>
        <button
          type="button"
          onClick={onManageSchedule}
          className="text-foreground border-border shrink-0 rounded-[5px] border px-3 py-1 text-sm font-medium"
        >
          나의 스케줄 관리
        </button>
      </div>

      <ScheduleSummaryTabs
        availability={availability}
        practices={practices}
        performances={performances}
      />

      {/* 주간 네비 + 합주/공연 토글 */}
      <div className="mb-s-3 relative flex items-center justify-center">
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
        <div className="absolute right-0 flex gap-2">
          <button
            type="button"
            onClick={() => setShowPractice((v) => !v)}
            className={cn(
              'rounded-full border px-3 py-0.5 text-sm font-medium transition-colors',
              showPractice
                ? 'border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]'
                : 'border-border text-foreground-muted',
            )}
          >
            합주 표시
          </button>
          <button
            type="button"
            onClick={() => setShowPerformance((v) => !v)}
            className={cn(
              'rounded-full border px-3 py-0.5 text-sm font-medium transition-colors',
              showPerformance
                ? 'border-[#60a5fa] bg-[#60a5fa]/10 text-[#60a5fa]'
                : 'border-border text-foreground-muted',
            )}
          >
            공연 표시
          </button>
        </div>
      </div>

      <div className="border-border rounded-md border">
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
                  className="bg-foreground-sub/80 absolute right-0 left-0"
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
                const height = Math.max(CELL_HEIGHT, (clippedEnd - clippedStart) * CELL_HEIGHT);
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
        </div>
      </div>
    </section>
  );
}
