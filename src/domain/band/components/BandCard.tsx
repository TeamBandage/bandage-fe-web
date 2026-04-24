import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/global/config/routes';

import type { BandInfoResponse } from '../types';

export function BandCard({ band }: { band: BandInfoResponse }) {
  return (
    <Link
      href={ROUTES.BAND_DETAIL(band.bandId)}
      className="focus-visible:ring-accent focus-visible:ring-offset-bg block rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card interactive padding="md">
        <div className="flex items-start gap-3">
          <Avatar
            size="lg"
            src={band.profileImg}
            fallback={band.bandName}
            alt={`${band.bandName} 프로필`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-base font-semibold">{band.bandName}</p>
            {band.description && (
              <p className="text-foreground-sub mt-1 line-clamp-2 text-sm">{band.description}</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
