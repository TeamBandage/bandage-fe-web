import { MapPin, Music } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { ROUTES } from '@/global/config/routes';

import { PracticeScheduleBadge } from './PracticeScheduleBadge';
import type { PracticeListItemResponse } from '../types';

export function PracticeCard({ practice }: { practice: PracticeListItemResponse }) {
  return (
    <Link
      href={ROUTES.PRACTICE_DETAIL(practice.practiceId)}
      className="focus-visible:ring-accent focus-visible:ring-offset-bg block rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card interactive padding="md">
        <div className="space-y-2">
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
      </Card>
    </Link>
  );
}
