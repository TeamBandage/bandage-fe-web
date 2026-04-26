import type { MemberSchedule, SlotMask } from './types';

/** 'YYYY-MM-DD' 형식 일자 범위 enumerate. inclusive both ends. */
export function enumerateDays(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
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

/** 단순 mock 공휴일 — 2026 한국 일부. 추후 BE 또는 외부 라이브러리로 교체. */
export const MOCK_KR_HOLIDAYS_2026 = new Set([
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-03-01',
  '2026-05-05',
  '2026-05-24',
  '2026-06-06',
  '2026-08-15',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-10-03',
  '2026-10-09',
  '2026-12-25',
]);

export function isHoliday(date: string): boolean {
  return MOCK_KR_HOLIDAYS_2026.has(date);
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

/** ISO week (월요일 시작) — 주차 시작일. */
export function startOfWeek(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day; // 월요일 기준
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
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
