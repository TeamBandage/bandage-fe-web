/**
 * 시간표 블록 컬러 팔레트 — Task 6 에서 본격 도입.
 * 12색 순환. 시안별 paletteSeed 로 시작점 회전, 블록은 paletteIndex 로 고정.
 *
 * - `bg/border/text` : 풀 채도. 곡 풀(드래그 손잡이) 등 강한 식별이 필요한 곳.
 * - `softBg/softBorder` : 다크 배경 위에 얹는 합주 블록용 톤다운 변형 (/25 bg + /60 border).
 *   같은 hue 를 유지하면서 시각 피로를 줄인다.
 * - `dim` : 12~15% 알파의 가장 약한 변형. 호버 프리뷰 등.
 */
export const PALETTE_TONES = [
  {
    bg: 'bg-accent',
    dim: 'bg-accent-dim',
    text: 'text-accent',
    border: 'border-accent',
    softBg: 'bg-accent/25',
    softBorder: 'border-accent/60',
  },
  {
    bg: 'bg-success',
    dim: 'bg-success-dim',
    text: 'text-success',
    border: 'border-success',
    softBg: 'bg-success/25',
    softBorder: 'border-success/60',
  },
  {
    bg: 'bg-warn',
    dim: 'bg-warn-dim',
    text: 'text-warn',
    border: 'border-warn',
    softBg: 'bg-warn/25',
    softBorder: 'border-warn/60',
  },
  {
    bg: 'bg-amber',
    dim: 'bg-amber-dim',
    text: 'text-amber',
    border: 'border-amber',
    softBg: 'bg-amber/25',
    softBorder: 'border-amber/60',
  },
  {
    bg: 'bg-danger',
    dim: 'bg-danger-dim',
    text: 'text-danger',
    border: 'border-danger',
    softBg: 'bg-danger/25',
    softBorder: 'border-danger/60',
  },
] as const;

export type PaletteTone = (typeof PALETTE_TONES)[number];

export function paletteToneOf(seed: number, index: number): PaletteTone {
  const i = (seed + index) % PALETTE_TONES.length;
  return PALETTE_TONES[i] ?? PALETTE_TONES[0]!;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * 곡 단위로 안정된 색상 매핑.
 * 같은 board 안에서 같은 songId 는 항상 같은 색. 시안(paletteSeed) 마다 회전.
 */
export function songTone(songId: string, paletteSeed: number): PaletteTone {
  const i = (hashString(songId) + paletteSeed) % PALETTE_TONES.length;
  return PALETTE_TONES[i] ?? PALETTE_TONES[0]!;
}
