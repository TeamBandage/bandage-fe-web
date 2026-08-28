import type { ListItemSelectedTone } from '@/lib/list-item-styles';

export type DomainType = 'band' | 'practice' | 'performance' | 'track-selection' | 'setlist';

/** 리스트/카드에서 도메인 대표 이미지로 쓰는 정적 아이콘 이미지. AI 생성 아이콘(BD-160) 대체. */
export const DOMAIN_IMAGES: Record<DomainType, string> = {
  band: '/img/band_img.png',
  practice: '/img/jam_img.png',
  performance: '/img/performance_img.png',
  'track-selection': '/img/track_selec_img.png',
  setlist: '/img/setlist_img.png',
};

/** 리스트 선택 상태 톤은 design/dist/css/screens.css 기준으로 accent / amber 두 가지만 사용. */
export const DOMAIN_LIST_SELECTED_TONES: Record<DomainType, ListItemSelectedTone> = {
  band: 'accent',
  practice: 'accent',
  performance: 'amber',
  'track-selection': 'accent',
  setlist: 'accent',
};
