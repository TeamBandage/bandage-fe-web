/**
 * 주별 lock 복제 — 기준 주(srcWeekStart) 의 lock 들을 대상 주차들(targetWeekStarts)에
 * 동일 요일·슬롯으로 복사. 충돌 발생 시 reflowMatrixLocks 로 자동 정리.
 */
import { addDays, startOfWeek } from '../utils';
import type { LockedSlot } from '../store/matrixLockStore';
import { reflowMatrixLocks } from './reflowMatrixLocks';

interface CopyArgs {
  /** 회의 전체 lock. (모든 주차 포함) */
  locks: LockedSlot[];
  meetingId: string;
  /** 기준 주의 월요일 'YYYY-MM-DD'. */
  srcWeekStart: string;
  /** 적용 대상 주차들의 월요일 목록. srcWeekStart 와 같은 값 포함 시 무시. */
  targetWeekStarts: string[];
  slotFrom: number;
  slotTo: number;
  /** 회의 가용 일자(정렬됨) — reflow 의 sortedDates 입력. */
  availableDates: string[];
  /** 새 lock id 생성기 — 호출부(store) 가 책임. */
  newId: () => string;
  nowIso: () => string;
}

/**
 * 결과:
 *  - success: 새 locks 배열 (회의 전체 lock 의 새 스냅샷)
 *  - null: reflow 실패 (자리 부족)
 */
export function copyWeekLocks({
  locks,
  meetingId,
  srcWeekStart,
  targetWeekStarts,
  slotFrom,
  slotTo,
  availableDates,
  newId,
  nowIso,
}: CopyArgs): LockedSlot[] | null {
  const srcStart = startOfWeek(srcWeekStart);
  const uniqueTargets = Array.from(
    new Set(targetWeekStarts.map((w) => startOfWeek(w)).filter((w) => w !== srcStart)),
  );
  if (uniqueTargets.length === 0) return locks;

  // 기준 주의 lock 추출 — 일자가 srcStart..srcStart+6 안.
  const srcEnd = addDays(srcStart, 6);
  const srcLocks = locks.filter((l) => l.date >= srcStart && l.date <= srcEnd);
  if (srcLocks.length === 0) return locks;

  let working: LockedSlot[] = [...locks];

  for (const tgtStart of uniqueTargets) {
    // 대상 주에 srcLocks 와 동일 요일·슬롯으로 새 lock 생성.
    const newLocks: LockedSlot[] = srcLocks.map((src) => {
      const offset = daysBetween(srcStart, src.date);
      const newDate = addDays(tgtStart, offset);
      return {
        id: newId(),
        meetingId,
        date: newDate,
        startSlot: src.startSlot,
        endSlot: src.endSlot,
        songId: src.songId,
        lockedAt: nowIso(),
      };
    });

    // 기존 working + newLocks 합치고, 각 새 lock 을 anchor 로 reflow.
    let combined = [...working, ...newLocks];
    for (const anchor of newLocks) {
      const reflowed = reflowMatrixLocks({
        locks: combined,
        anchorLockId: anchor.id,
        slotFrom,
        slotTo,
        availableDates,
      });
      if (!reflowed) return null;
      combined = reflowed;
    }
    working = combined;
  }

  return working;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}
