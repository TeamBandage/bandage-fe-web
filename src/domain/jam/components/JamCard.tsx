import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { IconTile } from '@/components/ui/icon-tile';
import { ROUTES } from '@/global/config/routes';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

import { JamDday } from './JamDday';
import { JamScheduleBadge } from './JamScheduleBadge';
import type { JamListItemResponse } from '../types';

const PracticeIcon = DOMAIN_ICONS.practice;

export function JamCard({
  practice,
  selected = false,
}: {
  practice: JamListItemResponse;
  selected?: boolean;
}) {
  return (
    <Link
      href={ROUTES.JAM_DETAIL(practice.jamId)}
      aria-current={selected ? 'page' : undefined}
      data-slot="practice-card"
      className={listItemClasses(
        selected,
        DOMAIN_LIST_SELECTED_TONES.practice,
        'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
    >
      <IconTile icon={<PracticeIcon />} size="md" tone={DOMAIN_TONES.practice} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground line-clamp-1 text-base font-semibold">{practice.title}</p>
          <JamDday startAt={practice.startAt} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <JamScheduleBadge startAt={practice.startAt} durationMinutes={practice.durationMinutes} />
          {practice.venue && (
            <span className="text-foreground-sub inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {practice.venue}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
