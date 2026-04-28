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

  // 가능한 빈 슬롯 찾기.
  const findFreeSlot = (
    excludeBlockId: string,
    durationSlots: number,
  ): { date: string; startSlot: number } | null => {
    for (const date of sortedDates) {
      const occupied = Array.from(placedRanges.values()).filter(
        (r) => r.date === date && r.blockId !== excludeBlockId,
      );
      for (let s = c.workingHoursStart; s + durationSlots <= c.workingHoursEnd; s++) {
        const candidate: OccupiedRange = {
          date,
          start: s,
          end: s + durationSlots,
          blockId: excludeBlockId,
        };
        if (c.excludeLateNight && candidate.start >= 44) continue;
        const collides = occupied.some((o) => overlap(o, candidate));
        if (!collides) return { date, startSlot: s };
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
        const free = findFreeSlot(other.blockId, other.durationSlots);
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
