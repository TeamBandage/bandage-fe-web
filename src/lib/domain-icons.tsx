import { Clock3, Guitar, ListMusic, Music2, type LucideIcon } from 'lucide-react';

import type { IconTileTone } from '@/components/ui/icon-tile';
import type { ListItemSelectedTone } from '@/lib/list-item-styles';

export type DomainType = 'band' | 'practice' | 'performance' | 'setlist-meeting';

export const DOMAIN_ICONS: Record<DomainType, LucideIcon> = {
  band: Guitar,
  practice: Clock3,
  performance: Music2,
  'setlist-meeting': ListMusic,
};

export const DOMAIN_TONES: Record<DomainType, IconTileTone> = {
  band: 'accent',
  practice: 'success',
  performance: 'amber',
  'setlist-meeting': 'accent',
};

/** 리스트 선택 상태 톤은 design/dist/css/screens.css 기준으로 accent / amber 두 가지만 사용. */
export const DOMAIN_LIST_SELECTED_TONES: Record<DomainType, ListItemSelectedTone> = {
  band: 'accent',
  practice: 'accent',
  performance: 'amber',
  'setlist-meeting': 'accent',
};
