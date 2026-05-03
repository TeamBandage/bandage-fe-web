/**
 * Task 13 — Auto-rescheduling.
 * 사용자가 블록을 drag-drop 하면 충돌하는 후속 블록을 빈 슬롯으로 BFS 재배치.
 * pinned 블록은 이동 금지. workingHours 범위 밖은 placement 후보 제외.
 */
import {
  DEFAULT_BOARD_CONSTRAINTS,
  type ScheduleBlock,
  type ScheduleBoardConstraints,
} from '../types';

interface RescheduleInput {
  blocks: ScheduleBlock[];
  /** 사용자가 막 옮긴 블록의 id — 이 블록은 그대로 유지(앵커). */
  anchorBlockId: string;
  constraints: ScheduleBoardConstraints;
  /** 가용 일자 목록 — 이 안에서만 재배치 가능. */
  availableDates: string[];
}

/**
 * Task 13.x — 드롭 가능한 (date, slot) 후보 계산.
 * - workingHours / excludeLateNight 준수
 * - 다른 블록(pinned 포함)과 겹치지 않음
 * - excludeBlockId(이동 중인 블록) 자기 자신은 occupied 에서 제외
 *
 * 반환: Set<`${date}__${slot}`>
 */
export function computeValidDropSlots({
  blocks,
  excludeBlockId,
  durationSlots,
  constraints,
  dates,
}: {
  blocks: ScheduleBlock[];
  excludeBlockId?: string;
  durationSlots: number;
  constraints: ScheduleBoardConstraints;
  dates: string[];
}): Set<string> {
  const c = { ...DEFAULT_BOARD_CONSTRAINTS, ...constraints };
  const out = new Set<string>();
  const occupiedByDate = new Map<string, OccupiedRange[]>();
  for (const b of blocks) {
    if (b.blockId === excludeBlockId) continue;
    const arr = occupiedByDate.get(b.date) ?? [];
    arr.push({
      date: b.date,
      start: b.startSlot,
      end: b.startSlot + b.durationSlots,
      blockId: b.blockId,
    });
    occupiedByDate.set(b.date, arr);
  }
  for (const date of dates) {
    const occupied = occupiedByDate.get(date) ?? [];
    for (let s = c.workingHoursStart; s + durationSlots <= c.workingHoursEnd; s++) {
      if (c.excludeLateNight && s >= 44) continue;
      const candidate: OccupiedRange = {
        date,
        start: s,
        end: s + durationSlots,
        blockId: excludeBlockId ?? '',
      };
      const collides = occupied.some((o) => overlap(o, candidate));
      if (!collides) out.add(`${date}__${s}`);
    }
  }
  return out;
}

interface OccupiedRange {
  date: string;
  start: number;
  end: number;
  blockId: string;
}

const overlap = (a: OccupiedRange, b: OccupiedRange) =>
  a.date === b.date && a.start < b.end && b.start < a.end;

const fitsConstraints = (block: ScheduleBlock, c: ScheduleBoardConstraints): boolean => {
  if (block.startSlot < c.workingHoursStart) return false;
  if (block.startSlot + block.durationSlots > c.workingHoursEnd) return false;
  if (c.excludeLateNight && block.startSlot >= 44) return false;
  return true;
};

/**
 * 단순 cascade 알고리즘:
 *  - anchor 를 고정.
 *  - 다른 블록들 중 anchor 와 겹치면 다음 가능 슬롯으로 이동(같은 날짜 우선, 안 되면 다음 가용 일자).
 *  - 이동된 블록이 또 다른 블록과 겹치면 BFS 로 후속 처리.
 *  - pinned 블록은 이동 불가 — 충돌 시 anchor 가 무효화되어 원본 반환.
 */
export function autoRescheduleAfterMove({
  blocks,
  anchorBlockId,
  constraints,
  availableDates,
}: RescheduleInput): ScheduleBlock[] | null {
  const c = { ...DEFAULT_BOARD_CONSTRAINTS, ...constraints };
  const anchor = blocks.find((b) => b.blockId === anchorBlockId);
  if (!anchor) return blocks;
  if (!fitsConstraints(anchor, c)) return null;

  const result = new Map<string, ScheduleBlock>(blocks.map((b) => [b.blockId, { ...b }]));
  const queue: string[] = [anchorBlockId];
  const placedRanges = new Map<string, OccupiedRange>();
  const sortedDates = [...availableDates].sort();

  // 초기 점유 — anchor.
  placedRanges.set(anchorBlockId, {
    date: anchor.date,
    start: anchor.startSlot,
    end: anchor.startSlot + anchor.durationSlots,
    blockId: anchorBlockId,
  });

  /**
   * 빈 슬롯 탐색 — origin(원래 위치) 부터 forward 우선, 없으면 wrap.
   * 의도: 충돌로 밀려나는 블록이 시간표 맨 앞으로 튕기지 않고
   *       원래 위치 근처(같은 날의 더 늦은 슬롯 → 다음 날) 로 부드럽게 이동.
   */
  const findFreeSlot = (
    excludeBlockId: string,
    durationSlots: number,
    origin: { date: string; slot: number },
  ): { date: string; startSlot: number } | null => {
    const tryAt = (date: string, s: number) => {
      const candidate: OccupiedRange = {
        date,
        start: s,
        end: s + durationSlots,
        blockId: excludeBlockId,
      };
      if (s < c.workingHoursStart) return null;
      if (s + durationSlots > c.workingHoursEnd) return null;
      if (c.excludeLateNight && s >= 44) return null;
      const occupied = Array.from(placedRanges.values()).filter(
        (r) => r.date === date && r.blockId !== excludeBlockId,
      );
      const collides = occupied.some((o) => overlap(o, candidate));
      return collides ? null : { date, startSlot: s };
    };

    const originIdx = Math.max(0, sortedDates.indexOf(origin.date));

    // 1) origin 일자 — origin 슬롯부터 forward.
    if (sortedDates[originIdx]) {
      for (let s = origin.slot; s + durationSlots <= c.workingHoursEnd; s++) {
        const r = tryAt(sortedDates[originIdx]!, s);
        if (r) return r;
      }
    }
    // 2) origin 이후 일자 — 매일 워킹 시작부터.
    for (let i = originIdx + 1; i < sortedDates.length; i++) {
      for (let s = c.workingHoursStart; s + durationSlots <= c.workingHoursEnd; s++) {
        const r = tryAt(sortedDates[i]!, s);
        if (r) return r;
      }
    }
    // 3) wrap — origin 일자 이전 (origin 일자 자체는 origin 슬롯 직전까지).
    for (let i = 0; i <= originIdx; i++) {
      const date = sortedDates[i]!;
      const upperBound = i === originIdx ? origin.slot : c.workingHoursEnd;
      for (let s = c.workingHoursStart; s + durationSlots <= upperBound; s++) {
        const r = tryAt(date, s);
        if (r) return r;
      }
    }
    return null;
  };

  while (queue.length > 0) {
    const headId = queue.shift()!;
    const head = result.get(headId)!;
    const headRange: OccupiedRange = {
      date: head.date,
      start: head.startSlot,
      end: head.startSlot + head.durationSlots,
      blockId: head.blockId,
    };
    placedRanges.set(headId, headRange);

    for (const other of result.values()) {
      if (other.blockId === headId) continue;
      if (placedRanges.has(other.blockId)) continue;
      const otherRange: OccupiedRange = {
        date: other.date,
        start: other.startSlot,
        end: other.startSlot + other.durationSlots,
        blockId: other.blockId,
      };
      if (overlap(headRange, otherRange)) {
        if (other.pinned) {
          // pinned 충돌 — 재배치 불가. 사용자에게 안내하기 위해 null 반환.
          return null;
        }
        // origin = 충돌이 일어난 위치(=원래 위치). 이 지점 부터 forward 검색.
        const free = findFreeSlot(other.blockId, other.durationSlots, {
          date: other.date,
          slot: other.startSlot,
        });
        if (!free) return null;
        result.set(other.blockId, {
          ...other,
          date: free.date,
          startSlot: free.startSlot,
        });
        queue.push(other.blockId);
      } else {
        placedRanges.set(other.blockId, otherRange);
      }
    }
  }

  return Array.from(result.values());
}
