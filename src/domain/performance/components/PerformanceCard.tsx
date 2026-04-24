import { CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { ROUTES } from '@/global/config/routes';
import { formatKst, parseKst } from '@/lib/date';

import { PerformanceDday } from './PerformanceDday';
import type { PerformanceListItemResponse } from '../types';

export function PerformanceCard({ performance }: { performance: PerformanceListItemResponse }) {
  let label = performance.startAt;
  try {
    label = formatKst(parseKst(performance.startAt), 'M월 d일 (EEE) HH:mm');
  } catch {
    // keep raw
  }

  return (
    <Link
      href={ROUTES.PERFORMANCE_DETAIL(performance.performanceId)}
      className="focus-visible:ring-accent focus-visible:ring-offset-bg block rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card interactive padding="md">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-foreground line-clamp-1 text-base font-semibold">
              {performance.title}
            </p>
            <PerformanceDday startAt={performance.startAt} />
          </div>
          <div className="text-foreground-sub flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {label} ({performance.durationMinutes}분)
            </span>
            {performance.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {performance.venue}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
