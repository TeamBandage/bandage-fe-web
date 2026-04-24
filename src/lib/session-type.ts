import type { SessionType } from '@/global/types';

/**
 * SessionType 별 색상 매핑.
 * oklch 토큰 기반이지만 `@theme` 에 정식 추가하기 전까지는 임시 상수로 관리.
 * Chip / SessionRow / SessionChipBadge 등 어디서든 이 테이블을 참조한다.
 */
export const SESSION_TYPE_CLASSES: Record<SessionType, string> = {
  VOCAL: 'bg-[oklch(0.62_0.22_250_/_0.18)] text-[oklch(0.82_0.12_250)]',
  CHORUS: 'bg-[oklch(0.62_0.22_290_/_0.18)] text-[oklch(0.82_0.12_290)]',
  GUITAR: 'bg-[oklch(0.62_0.22_40_/_0.18)] text-[oklch(0.82_0.12_40)]',
  BASS: 'bg-[oklch(0.62_0.22_10_/_0.18)] text-[oklch(0.82_0.12_10)]',
  DRUM: 'bg-[oklch(0.62_0.22_140_/_0.18)] text-[oklch(0.82_0.12_140)]',
  PERCUSSION: 'bg-[oklch(0.62_0.22_170_/_0.18)] text-[oklch(0.82_0.12_170)]',
  SYNTH: 'bg-[oklch(0.62_0.22_320_/_0.18)] text-[oklch(0.82_0.12_320)]',
  ETC: 'bg-card-hover text-foreground-sub',
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  VOCAL: '보컬',
  CHORUS: '코러스',
  GUITAR: '기타',
  BASS: '베이스',
  DRUM: '드럼',
  PERCUSSION: '퍼커션',
  SYNTH: '신스',
  ETC: '기타',
};

export function getSessionTypeClasses(type: SessionType): string {
  return SESSION_TYPE_CLASSES[type];
}

export function getSessionTypeLabel(type: SessionType): string {
  return SESSION_TYPE_LABEL[type];
}
