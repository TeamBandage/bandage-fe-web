import { CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';

import { IconTile } from '@/components/ui/icon-tile';
import { ROUTES } from '@/global/config/routes';
import { formatKst, parseKst } from '@/lib/date';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

import { PerformanceDday } from './PerformanceDday';
import type { PerformanceListItemResponse } from '../types';

const PerformanceIcon = DOMAIN_ICONS.performance;

export function PerformanceCard({
  performance,
  selected = false,
}: {
  performance: PerformanceListItemResponse;
  selected?: boolean;
}) {
  let label = performance.startAt;
  try {
    label = formatKst(parseKst(performance.startAt), 'M월 d일 (EEE) HH:mm');
  } catch {
    // keep raw
  }

  return (
    <Link
      href={ROUTES.PERFORMANCE_DETAIL(performance.performanceId)}
      aria-current={selected ? 'page' : undefined}
      data-slot="performance-card"
      className={listItemClasses(
        selected,
        DOMAIN_LIST_SELECTED_TONES.performance,
        'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
    >
      <IconTile icon={<PerformanceIcon />} size="md" tone={DOMAIN_TONES.performance} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground line-clamp-1 text-base font-semibold">
            {performance.title}
          </p>
          <PerformanceDday startAt={performance.startAt} />
        </div>
        <div className="text-foreground-sub flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded bg-white/8 px-1.5 py-0.5">
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
    </Link>
  );
}
