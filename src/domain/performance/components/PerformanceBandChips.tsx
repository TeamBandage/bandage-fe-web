import { Chip } from '@/components/ui/chip';

import type { PerformanceBandSummary } from '../types';

/**
 * 공연 참여 밴드 칩 목록.
 * API_SPEC §6-3 (2026-04-26) — 백엔드가 bandName 을 함께 반환하므로 단일 호출로 표시 가능.
 */
export function PerformanceBandChips({ bands }: { bands: PerformanceBandSummary[] }) {
  if (bands.length === 0) {
    return <span className="text-foreground-muted text-xs">참여 밴드 없음</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {bands.map((b) => (
        <Chip key={b.bandId}>{b.bandName}</Chip>
      ))}
    </div>
  );
}
