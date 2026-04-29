/**
 * 커버리지 히트맵 셀렉터 — (date, slot) → 가능한 userId Set.
 *
 * scope:
 *  - 'ALL'           — 전체 멤버 합집합 (기존 매트릭스 동작)
 *  - userId 배열      — 특정 곡 참여 멤버만 필터링 (곡별 가용시간 모드)
 *
 * key 포맷: `${date}__${slot}` — 기존 MatrixView 와 동일.
 */
import type { MemberSchedule } from '../types';

export type CoverageMap = Map<string, Set<string>>;

interface BuildArgs {
  memberSchedules: MemberSchedule[];
  allDays: string[];
  slotFrom: number;
  slotTo: number;
  /** 'ALL' 이거나, 필터링할 userId 배열. 빈 배열은 빈 결과를 반환. */
  scope: 'ALL' | string[];
}

export function buildCoverageHeatmap({
  memberSchedules,
  allDays,
  slotFrom,
  slotTo,
  scope,
}: BuildArgs): CoverageMap {
  const m: CoverageMap = new Map();
  const allowed = scope === 'ALL' ? null : new Set(scope);
  const targets = allowed ? memberSchedules.filter((s) => allowed.has(s.userId)) : memberSchedules;

  for (const date of allDays) {
    for (let s = slotFrom; s < slotTo; s++) {
      const set = new Set<string>();
      for (const sched of targets) {
        if (!sched.availableDates.includes(date)) continue;
        if (sched.blocks[date]?.[s]) set.add(sched.userId);
      }
      m.set(`${date}__${s}`, set);
    }
  }
  return m;
}

/**
 * 특정 곡의 참여 멤버 id 추출 — Song.confirmed (sessionId→userId[]) 를 flatten.
 * 곡 데이터가 없거나 confirmed 가 비어 있으면 빈 배열.
 */
export function flattenSongParticipants(confirmed: Record<string, string[]> | undefined): string[] {
  if (!confirmed) return [];
  const set = new Set<string>();
  for (const list of Object.values(confirmed)) {
    for (const id of list) set.add(id);
  }
  return Array.from(set);
}

/** ratio 계산 헬퍼 — totalMembers 분모. 0 분모 가드. */
export function coverageRatio(coverage: CoverageMap, date: string, slot: number, total: number) {
  if (total === 0) return 0;
  return (coverage.get(`${date}__${slot}`)?.size ?? 0) / total;
}
