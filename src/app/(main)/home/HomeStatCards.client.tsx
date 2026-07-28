'use client';

import { CalendarDays, Guitar, Music, Users } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import { useUpcomingPerformances } from '@/domain/performance/hooks/useUpcomingPerformances';
import { useUpcomingJams } from '@/domain/jam/hooks/useUpcomingJams';

function Stub() {
  return <Skeleton className="h-[84px] w-full" rounded="lg" />;
}

/**
 * 홈 상단 4-stat 요약. 참여 세션은 백엔드 통계 API 도입 전까지 mock '—' 표시.
 * (API_REQUIRED.md FE-API-014 GET /api/v1/members/me/stats 참고)
 */
export function HomeStatCards() {
  const bands = useMyBands();
  const bandCount = bands.data?.pages.flatMap((p) => p.content).length ?? 0;
  const practices = useUpcomingJams();
  const performances = useUpcomingPerformances();

  return (
    <div className="gap-s-3 grid grid-cols-2 lg:grid-cols-4" data-slot="home-stat-cards">
      {bands.isLoading ? (
        <Stub />
      ) : (
        <StatCard icon={Users} label="소속 밴드" value={bandCount} accent="accent" />
      )}
      {practices.isLoading ? (
        <Stub />
      ) : (
        <StatCard
          icon={Music}
          label="예정 합주"
          value={practices.data?.length ?? 0}
          accent="success"
        />
      )}
      {performances.isLoading ? (
        <Stub />
      ) : (
        <StatCard
          icon={CalendarDays}
          label="예정 공연"
          value={performances.data?.length ?? 0}
          accent="blue"
        />
      )}
      <StatCard icon={Guitar} label="참여 세션" value="—" accent="warn" />
    </div>
  );
}
