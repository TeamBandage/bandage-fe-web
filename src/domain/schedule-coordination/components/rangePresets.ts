/**
 * 시간표 표출 시간 프리셋 — 주차별 UI 와 매트릭스가 공통 사용.
 * scheduleViewStore.rangePresetByMeeting 에 보관되어 두 뷰가 동기화.
 */
export const RANGE_PRESETS = {
  '9-22': { start: 18, end: 44, label: '09-22' },
  '24h': { start: 0, end: 48, label: '24h' },
} as const;

export type RangePreset = keyof typeof RANGE_PRESETS;
export const DEFAULT_RANGE_PRESET: RangePreset = '9-22';
