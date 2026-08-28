import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';
import { DOMAIN_IMAGES, DOMAIN_LIST_SELECTED_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

import type { BandInfoResponse } from '../types';

export function BandCard({
  band,
  selected = false,
}: {
  band: BandInfoResponse;
  selected?: boolean;
}) {
  return (
    <Link
      href={ROUTES.BAND_DETAIL(band.bandId)}
      aria-current={selected ? 'page' : undefined}
      data-slot="band-card"
      className={listItemClasses(
        selected,
        DOMAIN_LIST_SELECTED_TONES.band,
        'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={band.profileImg || DOMAIN_IMAGES.band}
        alt={band.bandName}
        className="h-10 w-10 shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-base font-semibold">{band.bandName}</p>
        {band.description && (
          <p className="text-foreground-sub mt-1 line-clamp-2 text-sm">{band.description}</p>
        )}
      </div>
    </Link>
  );
}
