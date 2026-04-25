import { Clock3, Guitar, Music2, type LucideIcon } from 'lucide-react';

import type { IconTileTone } from '@/components/ui/icon-tile';

export type DomainType = 'band' | 'practice' | 'performance';

export const DOMAIN_ICONS: Record<DomainType, LucideIcon> = {
  band: Guitar,
  practice: Clock3,
  performance: Music2,
};

export const DOMAIN_TONES: Record<DomainType, IconTileTone> = {
  band: 'accent',
  practice: 'success',
  performance: 'amber',
};
