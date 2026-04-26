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
 * 곡 내에서 보여줄 세션 약어. 같은 패밀리(V↔V2, G↔G2, D↔D2)가 함께 있으면
 * 기본 세션을 'V1' / 'G1' / 'D1' 로 표기해 시각적 짝을 맞춘다. 단일이면 'V'/'G'/'D' 유지.
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
  return session.short;
}
