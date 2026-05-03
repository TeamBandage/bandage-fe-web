/**
 * 주별 ScheduleBlock 복제 — 기준 주의 블록 패턴을 대상 주차에 동일 요일·슬롯으로 복사.
 * 동작:
 *   1) 대상 주차의 기존 블록을 모두 제거 (사용자 의도: 선택 주차의 일정으로 덮어씀)
 *   2) 기준 주 블록을 요일·슬롯 그대로 옮겨 새 blockId 로 추가
 *   3) constraints 위반(워킹 아워 밖, 가용 일자 아님)인 블록은 skip
 * pinned 블록은 별도 보호 X — 사용자가 명시적으로 호출한 작업이므로 일괄 덮어씀.
 */
import { addDays, startOfWeek } from '../utils';
import type { ScheduleBlock, ScheduleBoardConstraints } from '../types';

interface CopyArgs {
  /** 보드 전체 블록. */
  blocks: ScheduleBlock[];
  /** 기준 주의 월요일 'YYYY-MM-DD'. */
  srcWeekStart: string;
  /** 적용 대상 주차들의 월요일 목록. srcWeekStart 와 같은 값은 무시. */
  targetWeekStarts: string[];
  constraints: ScheduleBoardConstraints;
  /** 회의 가용 일자 — 이 안에 들지 않는 일자에는 복사 skip. */
  availableDates: string[];
  newId: () => string;
}

const inWeek = (date: string, weekStart: string) => {
  const end = addDays(weekStart, 7);
  return date >= weekStart && date < end;
};

const daysBetween = (a: string, b: string): number => {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
};

export function copyWeekBlocks({
  blocks,
  srcWeekStart,
  targetWeekStarts,
  constraints,
  availableDates,
  newId,
}: CopyArgs): ScheduleBlock[] {
  const srcStart = startOfWeek(srcWeekStart);
  const uniqueTargets = Array.from(
    new Set(targetWeekStarts.map((w) => startOfWeek(w)).filter((w) => w !== srcStart)),
  );
  if (uniqueTargets.length === 0) return blocks;

  const srcBlocks = blocks.filter((b) => inWeek(b.date, srcStart));
  const availableSet = new Set(availableDates);

  // 1) 대상 주차의 기존 블록은 전부 제거.
  const result = blocks.filter((b) => !uniqueTargets.some((tgt) => inWeek(b.date, tgt)));

  // 2) 기준 주 블록을 각 대상 주차에 매핑하여 추가.
  for (const tgtStart of uniqueTargets) {
    for (const src of srcBlocks) {
      const offset = daysBetween(srcStart, src.date);
      const newDate = addDays(tgtStart, offset);
      if (!availableSet.has(newDate)) continue;
      // 길이가 워킹 아워를 벗어나면 skip.
      const end = src.startSlot + src.durationSlots;
      if (src.startSlot < constraints.workingHoursStart || end > constraints.workingHoursEnd) {
        continue;
      }
      result.push({
        ...src,
        blockId: newId(),
        date: newDate,
      });
    }
  }
  return result;
}
