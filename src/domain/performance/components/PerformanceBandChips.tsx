import { Chip } from '@/components/ui/chip';

/**
 * 공연 참여 밴드 칩 목록.
 * 현재는 bandId 만 표시 — 밴드 상세 조회는 호출 비용 고려해 추후 ID→이름 캐시 또는
 * 백엔드가 PerformanceDetailResponse 에 band 요약 필드를 추가하는 방향으로 확장.
 */
export function PerformanceBandChips({ bandIds }: { bandIds: string[] }) {
  if (bandIds.length === 0) {
    return <span className="text-foreground-muted text-xs">참여 밴드 없음</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {bandIds.map((id) => (
        <Chip key={id}>밴드 {id.slice(0, 8)}</Chip>
      ))}
    </div>
  );
}
