import { MapPin, Music } from 'lucide-react';
import Link from 'next/link';

import { IconTile } from '@/components/ui/icon-tile';
import { ROUTES } from '@/global/config/routes';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

import { PracticeScheduleBadge } from './PracticeScheduleBadge';
import type { PracticeListItemResponse } from '../types';

const PracticeIcon = DOMAIN_ICONS.practice;

export function PracticeCard({
  practice,
  selected = false,
}: {
  practice: PracticeListItemResponse;
  selected?: boolean;
}) {
  return (
    <Link
      href={ROUTES.PRACTICE_DETAIL(practice.practiceId)}
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
        <p className="text-foreground line-clamp-1 text-base font-semibold">{practice.title}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <PracticeScheduleBadge
            startAt={practice.startAt}
            durationMinutes={practice.durationMinutes}
          />
          {practice.venue && (
            <span className="text-foreground-sub inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {practice.venue}
            </span>
          )}
          {practice.song && (
            <span className="text-foreground-sub inline-flex items-center gap-1">
              <Music className="h-3 w-3" aria-hidden="true" />
              {practice.song.title} — {practice.song.artist}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
