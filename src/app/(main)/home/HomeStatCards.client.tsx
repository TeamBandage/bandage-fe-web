'use client';

import { CalendarDays, Music, Users } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import { useUpcomingPerformances } from '@/domain/performance/hooks/useUpcomingPerformances';
import { useUpcomingPractices } from '@/domain/practice/hooks/useUpcomingPractices';

function Stub() {
  return <Skeleton className="h-[84px] w-full" rounded="lg" />;
}

/**
 * 홈 상단 3-stat 요약.
 * 참여 세션 수는 list API 에 포함되지 않아 현재 누락 (추후 별도 summary API 도입 예정).
 */
export function HomeStatCards() {
  const bands = useMyBands();
  const practices = useUpcomingPractices();
  const performances = useUpcomingPerformances();

  return (
    <div className="gap-s-3 grid grid-cols-1 sm:grid-cols-3" data-slot="home-stat-cards">
      {bands.isLoading ? (
        <Stub />
      ) : (
        <StatCard icon={Users} label="소속 밴드" value={bands.data?.length ?? 0} accent="accent" />
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
          accent="amber"
        />
      )}
    </div>
  );
}
