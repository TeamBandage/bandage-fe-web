/**
 * 시간표 블록 컬러 팔레트 — Task 6 에서 본격 도입.
 * 12색 순환. 시안별 paletteSeed 로 시작점 회전, 블록은 paletteIndex 로 고정.
 */
export const PALETTE_TONES = [
  { bg: 'bg-accent', dim: 'bg-accent-dim', text: 'text-accent', border: 'border-accent' },
  { bg: 'bg-success', dim: 'bg-success-dim', text: 'text-success', border: 'border-success' },
  { bg: 'bg-warn', dim: 'bg-warn-dim', text: 'text-warn', border: 'border-warn' },
  { bg: 'bg-amber', dim: 'bg-amber-dim', text: 'text-amber', border: 'border-amber' },
  { bg: 'bg-danger', dim: 'bg-danger-dim', text: 'text-danger', border: 'border-danger' },
] as const;

export type PaletteTone = (typeof PALETTE_TONES)[number];

export function paletteToneOf(seed: number, index: number): PaletteTone {
  const i = (seed + index) % PALETTE_TONES.length;
  return PALETTE_TONES[i] ?? PALETTE_TONES[0]!;
}
