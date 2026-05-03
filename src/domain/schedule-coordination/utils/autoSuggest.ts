/**
 * Task 12 — 자동 추천 알고리즘.
 * 멤버 가용 종합 기준 동시 가능 인원이 많은 시간 슬롯에 곡을 순차 배치한다.
 */
import type { ScheduleBlock } from '../types';
import { aggregateAvailability } from '../utils';

export interface SuggestSongInput {
  id: string;
  title: string;
}

export interface SuggestInput {
  schedules: Parameters<typeof aggregateAvailability>[0];
  dates: string[];
  songs: SuggestSongInput[];
  /** 곡당 기본 길이 (슬롯 단위, 30분=1). 기본 4슬롯=2시간. */
  blockDurationSlots?: number;
  /** 변형 시안 개수. 기본 3. */
  variantCount?: number;
  /** 분당 최소 인원 (필터). */
  minMembers?: number;
}

export interface BoardVariant {
  blocks: Omit<ScheduleBlock, 'pinned' | 'paletteIndex'>[];
}

const newBlockId = () => `blk_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

interface RankedSlot {
  date: string;
  slot: number;
  count: number;
}

function rankSlots(aggregate: Record<string, number[]>, minMembers: number): RankedSlot[] {
  const out: RankedSlot[] = [];
  for (const date of Object.keys(aggregate)) {
    const counts = aggregate[date] ?? [];
    for (let i = 0; i < counts.length; i++) {
      const c = counts[i] ?? 0;
      if (c >= minMembers) out.push({ date, slot: i, count: c });
    }
  }
  out.sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.slot - b.slot);
  return out;
}

function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/**
 * 변형 시안들을 생성. 각 변형은 곡 정렬 순서 회전을 통해 시작점이 다름.
 * 충돌(같은 날짜+슬롯 겹침)은 회피하면서 곡 단위로 1개 이상 배치.
 */
export function suggestScheduleBoards({
  schedules,
  dates,
  songs,
  blockDurationSlots = 4,
  variantCount = 3,
  minMembers = 2,
}: SuggestInput): BoardVariant[] {
  if (songs.length === 0 || dates.length === 0) return [];
  const aggregate = aggregateAvailability(schedules, dates);
  const ranked = rankSlots(aggregate, minMembers);
  if (ranked.length === 0) return [];

  const variants: BoardVariant[] = [];
  for (let v = 0; v < variantCount; v++) {
    const orderedSongs = rotate(songs, v);
    const placed: Omit<ScheduleBlock, 'pinned' | 'paletteIndex'>[] = [];
    const occupied = new Set<string>();

    for (const song of orderedSongs) {
      const slot = ranked.find((s) => {
        for (let i = 0; i < blockDurationSlots; i++) {
          if (occupied.has(`${s.date}__${s.slot + i}`)) return false;
          if (s.slot + i >= 48) return false;
        }
        return true;
      });
      if (!slot) break;
      for (let i = 0; i < blockDurationSlots; i++) {
        occupied.add(`${slot.date}__${slot.slot + i}`);
      }
      placed.push({
        blockId: newBlockId(),
        songId: song.id,
        date: slot.date,
        startSlot: slot.slot,
        durationSlots: blockDurationSlots,
      });
    }
    variants.push({ blocks: placed });
  }

  return variants;
}
