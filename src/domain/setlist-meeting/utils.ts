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
