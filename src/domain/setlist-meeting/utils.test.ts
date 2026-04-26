import { describe, expect, it } from 'vitest';

import { SEED_SONGS } from './mock/seed';
import type { Song } from './types';
import { confirmedCount, isReady, missingCount, sessionState, totalNeed } from './utils';

const findSong = (id: string): Song => {
  const s = SEED_SONGS.find((x) => x.id === id);
  if (!s) throw new Error(`seed song ${id} not found`);
  return s;
};

describe('sessionState', () => {
  it('returns full when confirmed >= need', () => {
    expect(sessionState(['u1'], 1)).toBe('full');
    expect(sessionState(['u1', 'u2'], 1)).toBe('full');
  });
  it('returns partial when 0 < confirmed < need', () => {
    expect(sessionState(['u1'], 2)).toBe('partial');
  });
  it('returns empty when none confirmed', () => {
    expect(sessionState([], 1)).toBe('empty');
    expect(sessionState(undefined, 1)).toBe('empty');
  });
});

describe('totalNeed / confirmedCount / missingCount / isReady', () => {
  it('Jambi (s2): 4 sessions, all confirmed → ready', () => {
    const s = findSong('s2');
    expect(totalNeed(s)).toBe(4);
    expect(confirmedCount(s)).toBe(4);
    expect(missingCount(s)).toBe(0);
    expect(isReady(s)).toBe(true);
  });

  it('Vicarious (s1): D 미확정 → not ready', () => {
    const s = findSong('s1');
    expect(totalNeed(s)).toBe(4);
    expect(confirmedCount(s)).toBe(3);
    expect(missingCount(s)).toBe(1);
    expect(isReady(s)).toBe(false);
  });

  it('10,000 Days (s4): custom 세션 포함 → totalNeed 6, PERC 미확정으로 not ready', () => {
    const s = findSong('s4');
    expect(totalNeed(s)).toBe(6);
    expect(confirmedCount(s)).toBe(5);
    expect(missingCount(s)).toBe(1);
    expect(isReady(s)).toBe(false);
  });
});
