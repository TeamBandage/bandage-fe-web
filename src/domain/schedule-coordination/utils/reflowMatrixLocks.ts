/**
 * 매트릭스 lock 재배치 — 새로 떨어진 lock(anchor) 와 겹치는 기존 lock 들을
 * 가까운 빈 시간대(forward 우선)로 자동 이동.
 * autoReschedule.ts (board 용) 의 lock 버전.
 */
import type { LockedSlot } from '../store/matrixLockStore';

interface ReflowOptions {
  locks: LockedSlot[];
  anchorLockId: string;
  /** 워킹 슬롯 범위 (matrix 기본 18~46). */
  slotFrom: number;
  slotTo: number;
  /** 정렬된 가용 일자. */
  availableDates: string[];
}

interface Pos {
  date: string;
  startSlot: number;
}

const overlap = (a: Pos & { dur: number }, b: Pos & { dur: number }) =>
  a.date === b.date && a.startSlot < b.startSlot + b.dur && b.startSlot < a.startSlot + a.dur;

export function reflowMatrixLocks({
  locks,
  anchorLockId,
  slotFrom,
  slotTo,
  availableDates,
}: ReflowOptions): LockedSlot[] | null {
  const anchor = locks.find((l) => l.id === anchorLockId);
  if (!anchor) return locks;

  const sortedDates = [...availableDates].sort();
  const dur = (l: LockedSlot) => l.endSlot - l.startSlot;

  /** id → 새 위치. anchor 부터 채움. */
  const placed = new Map<string, Pos>();
  placed.set(anchor.id, { date: anchor.date, startSlot: anchor.startSlot });

  const findFree = (excludeId: string, d: number, origin: Pos): Pos | null => {
    const tryAt = (date: string, s: number): Pos | null => {
      if (s < slotFrom || s + d > slotTo) return null;
      for (const [id, pos] of placed.entries()) {
        if (id === excludeId) continue;
        const otherDur = dur(locks.find((l) => l.id === id)!);
        if (overlap({ ...pos, dur: otherDur }, { date, startSlot: s, dur: d })) return null;
      }
      return { date, startSlot: s };
    };

    const idx = Math.max(0, sortedDates.indexOf(origin.date));
    // 1) origin 일자, origin 슬롯부터 forward
    if (sortedDates[idx]) {
      for (let s = origin.startSlot; s + d <= slotTo; s++) {
        const r = tryAt(sortedDates[idx]!, s);
        if (r) return r;
      }
    }
    // 2) 이후 일자
    for (let i = idx + 1; i < sortedDates.length; i++) {
      for (let s = slotFrom; s + d <= slotTo; s++) {
        const r = tryAt(sortedDates[i]!, s);
        if (r) return r;
      }
    }
    // 3) wrap
    for (let i = 0; i <= idx; i++) {
      const upper = i === idx ? origin.startSlot : slotTo;
      for (let s = slotFrom; s + d <= upper; s++) {
        const r = tryAt(sortedDates[i]!, s);
        if (r) return r;
      }
    }
    return null;
  };

  // 다른 lock 들을 (date, startSlot) 순으로 처리.
  const others = locks
    .filter((l) => l.id !== anchor.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startSlot - b.startSlot);

  for (const o of others) {
    const d = dur(o);
    // 우선 원래 자리 시도.
    const orig: Pos = { date: o.date, startSlot: o.startSlot };
    let collides = false;
    for (const [id, pos] of placed.entries()) {
      if (id === o.id) continue;
      const od = dur(locks.find((l) => l.id === id)!);
      if (overlap({ ...orig, dur: d }, { ...pos, dur: od })) {
        collides = true;
        break;
      }
    }
    if (!collides) {
      placed.set(o.id, orig);
    } else {
      const free = findFree(o.id, d, orig);
      if (!free) return null;
      placed.set(o.id, free);
    }
  }

  return locks.map((l) => {
    const pos = placed.get(l.id);
    if (!pos) return l;
    const d = dur(l);
    return { ...l, date: pos.date, startSlot: pos.startSlot, endSlot: pos.startSlot + d };
  });
}
