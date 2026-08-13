import type { MemberSchedule, SlotMask } from './types';

/**
 * Date 를 로컬 캘린더 기준 'YYYY-MM-DD' 로 포맷.
 * `toISOString()` 은 UTC 기준이라 UTC+9 등에서 하루씩 어긋남(timezone bug) — 절대 사용 금지.
 */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' 형식 일자 범위 enumerate. inclusive both ends. */
export function enumerateDays(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toLocalISODate(d));
  }
  return out;
}

/** 0=일, 1=월, ... 6=토. */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00`).getDay();
}

export function isWeekend(date: string): boolean {
  const d = dayOfWeek(date);
  return d === 0 || d === 6;
}

/** 슬롯 인덱스 → 'HH:MM'. */
export function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}

/** 슬롯 인덱스 → 분(0~1440). */
export function slotToMin(slot: number): number {
  return slot * 30;
}

/** YYYY-MM-DD 유효성 가드 — 잘못된/빈 입력은 오늘 일자로 폴백. */
function safeDate(input: string): Date {
  const d = input ? new Date(`${input}T00:00:00`) : new Date();
  if (isNaN(d.getTime())) return new Date();
  return d;
}

/** ISO week (월요일 시작) — 주차 시작일. 빈 문자열/잘못된 입력 시 오늘 기준. */
export function startOfWeek(date: string): string {
  const d = safeDate(date);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day; // 월요일 기준
  d.setDate(d.getDate() + diff);
  return toLocalISODate(d);
}

export function addDays(date: string, n: number): string {
  const d = safeDate(date);
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

/**
 * 멤버 일정 종합 — 같은 날짜·슬롯에 동시 가능한 멤버 수 매트릭스.
 * 반환: date → SlotMask 형태가 아니라 date → number[] (슬롯별 가능 인원수).
 */
export function aggregateAvailability(
  schedules: MemberSchedule[],
  dates: string[],
): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const date of dates) {
    out[date] = Array.from({ length: 48 }, () => 0);
    for (const s of schedules) {
      if (!s.availableDates.includes(date)) continue;
      const mask = s.blocks[date];
      if (!mask) continue;
      for (let i = 0; i < 48; i++) {
        if (mask[i]) out[date]![i]! += 1;
      }
    }
  }
  return out;
}

export type ViewUnit = 'day' | 'week' | 'month';

/** Task 3 — 합주 기간 길이에 따른 자동 시각화 단위 추천. */
export function getViewUnit(from: string, to: string): ViewUnit {
  const days = enumerateDays(from, to).length;
  if (days <= 14) return 'day';
  if (days <= 60) return 'week';
  return 'month';
}

/** 주(월요일 시작) 시작일 목록. inclusive — 'from' 이 속한 주부터 'to' 이전까지. */
export function enumerateWeeks(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  let cursor = startOfWeek(from);
  while (cursor <= to) {
    out.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return out;
}

/** 월 시작일(YYYY-MM-01) 목록. inclusive. */
export function enumerateMonths(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  const start = safeDate(from);
  start.setDate(1);
  const end = safeDate(to);
  while (start <= end) {
    out.push(toLocalISODate(start));
    start.setMonth(start.getMonth() + 1);
  }
  return out;
}

/** SlotMask 에서 (start, end) min 범위 추출 — 가장 긴 연속 가능 구간. */
export function longestContiguousRange(mask: SlotMask): {
  startSlot: number;
  endSlot: number;
} | null {
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }
  if (bestLen === 0 || bestStart < 0) return null;
  return { startSlot: bestStart, endSlot: bestStart + bestLen };
}
