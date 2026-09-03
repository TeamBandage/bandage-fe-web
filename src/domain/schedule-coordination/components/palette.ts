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
  {
    bg: 'bg-lime',
    dim: 'bg-lime-dim',
    text: 'text-lime',
    border: 'border-lime',
    softBg: 'bg-lime/25',
    softBorder: 'border-lime/60',
  },
  {
    bg: 'bg-teal',
    dim: 'bg-teal-dim',
    text: 'text-teal',
    border: 'border-teal',
    softBg: 'bg-teal/25',
    softBorder: 'border-teal/60',
  },
  {
    bg: 'bg-sky',
    dim: 'bg-sky-dim',
    text: 'text-sky',
    border: 'border-sky',
    softBg: 'bg-sky/25',
    softBorder: 'border-sky/60',
  },
  {
    bg: 'bg-blue',
    dim: 'bg-blue-dim',
    text: 'text-blue',
    border: 'border-blue',
    softBg: 'bg-blue/25',
    softBorder: 'border-blue/60',
  },
  {
    bg: 'bg-violet',
    dim: 'bg-violet-dim',
    text: 'text-violet',
    border: 'border-violet',
    softBg: 'bg-violet/25',
    softBorder: 'border-violet/60',
  },
  {
    bg: 'bg-purple',
    dim: 'bg-purple-dim',
    text: 'text-purple',
    border: 'border-purple',
    softBg: 'bg-purple/25',
    softBorder: 'border-purple/60',
  },
  {
    bg: 'bg-pink',
    dim: 'bg-pink-dim',
    text: 'text-pink',
    border: 'border-pink',
    softBg: 'bg-pink/25',
    softBorder: 'border-pink/60',
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
 *
 * 해시 기반이라 songId 몇 개만 있어도 같은 색으로 우연히 겹칠 수 있다(생일 문제) — 겹치는 게
 * 절대 안 되는 화면은 이 함수 대신 아래 assignPaletteTones를 쓴다.
 */
export function songTone(songId: string, paletteSeed: number): PaletteTone {
  const i = (hashString(songId) + paletteSeed) % PALETTE_TONES.length;
  return PALETTE_TONES[i] ?? PALETTE_TONES[0]!;
}

/**
 * id 목록에 팔레트 색을 순서대로 하나씩 배정 — songTone과 달리 해시가 아니라 "몇 번째로
 * 처음 등장했는지"를 그대로 색 인덱스로 쓴다. 그래서:
 * - id 개수가 PALETTE_TONES.length(12) 이하면 전부 서로 다른 색(겹침 없음)이 보장된다.
 * - 12개를 넘으면 12개씩 순환하며 겹치는데, 각 색이 최대한 고르게(균등하게) 재사용된다
 *   (몫만큼은 모든 색이 똑같이 쓰이고 나머지만 앞쪽 색이 하나씩 더 씀).
 * - 목록 뒤에 새 id가 추가돼도 기존 id들의 색 배정은 그대로 유지된다(맨 뒤 id만 다음 색을
 *   새로 받음) — 해시 기반이면 트랙이 하나 늘 때마다 관련 없는 다른 트랙 색까지 재계산되진
 *   않지만, 이 방식은 "항상 같은 순서로 온다"는 보장이 없는 상황에서도 결정적이도록 순서
 *   자체를 인덱스로 못박아 무결성을 준다.
 */
export function assignPaletteTones(ids: readonly string[]): Map<string, PaletteTone> {
  const map = new Map<string, PaletteTone>();
  let index = 0;
  for (const id of ids) {
    if (map.has(id)) continue; // 같은 id가 중복으로 들어와도 인덱스를 소모하지 않는다.
    map.set(id, PALETTE_TONES[index % PALETTE_TONES.length]!);
    index++;
  }
  return map;
}
