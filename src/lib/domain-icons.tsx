import { CalendarDays, Guitar, ListMusic, Music, type LucideIcon } from 'lucide-react';

import type { IconTileTone } from '@/components/ui/icon-tile';
import type { ListItemSelectedTone } from '@/lib/list-item-styles';

export type DomainType = 'band' | 'practice' | 'performance' | 'track-selection';

export const DOMAIN_ICONS: Record<DomainType, LucideIcon> = {
  band: Guitar,
  practice: Music,
  performance: CalendarDays,
  'track-selection': ListMusic,
};

export const DOMAIN_TONES: Record<DomainType, IconTileTone> = {
  band: 'accent',
  practice: 'success',
  performance: 'blue',
  'track-selection': 'accent',
};

/** 리스트 선택 상태 톤은 design/dist/css/screens.css 기준으로 accent / amber 두 가지만 사용. */
export const DOMAIN_LIST_SELECTED_TONES: Record<DomainType, ListItemSelectedTone> = {
  band: 'accent',
  practice: 'accent',
  performance: 'amber',
  'track-selection': 'accent',
};
