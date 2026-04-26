import type { SessionDef, Song, SessionState } from './types';

export function sessionState(confirmed: string[] | undefined, need: number): SessionState {
  const cnt = confirmed?.length ?? 0;
  if (cnt >= need) return 'full';
  if (cnt > 0) return 'partial';
  return 'empty';
}

export function totalNeed(song: Song): number {
  return song.sessions.reduce((acc, s) => acc + s.need, 0);
}

export function confirmedCount(song: Song): number {
  return song.sessions.reduce((acc, s) => acc + (song.confirmed[s.id]?.length ?? 0), 0);
}

export function missingCount(song: Song): number {
  return Math.max(totalNeed(song) - confirmedCount(song), 0);
}

export function isReady(song: Song): boolean {
  return missingCount(song) === 0 && totalNeed(song) > 0;
}

export function findSession(song: Song, sessionId: string): SessionDef | undefined {
  return song.sessions.find((s) => s.id === sessionId);
}

/**
 * 곡 내에서 보여줄 세션 약어.
 * - V↔V2, G↔G2, D↔D2 가 함께 있으면 기본을 V1/G1/D1 로 표기.
 * - S1/S2 는 기본 'S' 가 별도로 없으므로 둘 중 하나만 있으면 'S' 로, 둘 다 있으면 S1/S2 그대로.
 */
export function displaySessionShort(session: SessionDef, all: SessionDef[]): string {
  const pairs: Array<[string, string]> = [
    ['V', 'V2'],
    ['G', 'G2'],
    ['D', 'D2'],
  ];
  for (const [base, sibling] of pairs) {
    if (session.id === base && all.some((s) => s.id === sibling)) return `${base}1`;
  }

  const synthIds = ['S1', 'S2'];
  if (synthIds.includes(session.id)) {
    const synthsPresent = all.filter((s) => synthIds.includes(s.id));
    if (synthsPresent.length === 1) return 'S';
  }

  return session.short;
}
