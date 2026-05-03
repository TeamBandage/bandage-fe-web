/**
 * 공연 검색 mock — 회의 만들기 마법사의 공연 선택 단계.
 * 실제 API: GET /api/v1/performances/search?q=
 */
import type { Member } from '../types';

import { GLOBAL_MEMBER_POOL } from './memberSearchMock';

export interface PerformanceMockBand {
  bandId: string;
  bandName: string;
  /** 해당 밴드의 멤버 userId 목록 — 공연 모드 참여 인원 자동 채움. */
  memberIds: string[];
}

export interface PerformanceMock {
  performanceId: string;
  title: string;
  venue: string;
  /** ISO datetime. */
  startAt: string;
  bands: PerformanceMockBand[];
}

export const MOCK_PERFORMANCES: PerformanceMock[] = [
  {
    performanceId: 'p_summer2026',
    title: '여름 합주 페스티벌',
    venue: '클럽 FF',
    startAt: '2026-08-15T19:00:00+09:00',
    bands: [
      { bandId: 'b1', bandName: 'DREAM THEATER TRIBUTE', memberIds: ['u1', 'u3', 'u4'] },
      { bandId: 'b3', bandName: '마그마', memberIds: ['u2', 'u5', 'u6'] },
    ],
  },
  {
    performanceId: 'p_homecoming',
    title: '홍대 홈커밍',
    venue: '롤링홀',
    startAt: '2026-09-20T20:00:00+09:00',
    bands: [
      { bandId: 'b1', bandName: 'DREAM THEATER TRIBUTE', memberIds: ['u1', 'u3', 'u4', 'u7'] },
    ],
  },
  {
    performanceId: 'p_yearend',
    title: '연말 합동 공연',
    venue: '제비다방',
    startAt: '2026-12-23T18:30:00+09:00',
    bands: [
      { bandId: 'b3', bandName: '마그마', memberIds: ['u2', 'u5', 'u6', 'u11'] },
      { bandId: 'b1', bandName: 'DREAM THEATER TRIBUTE', memberIds: ['u1', 'u4'] },
    ],
  },
];

export function searchMockPerformances(query: string, limit = 20): PerformanceMock[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_PERFORMANCES.slice(0, limit);
  return MOCK_PERFORMANCES.filter(
    (p) => p.title.toLowerCase().includes(q) || p.venue.toLowerCase().includes(q),
  ).slice(0, limit);
}

/** 공연의 모든 밴드 멤버를 평면화 — 중복 제거. */
export function flattenPerformanceMembers(p: PerformanceMock): Member[] {
  const seen = new Set<string>();
  const result: Member[] = [];
  for (const band of p.bands) {
    for (const uid of band.memberIds) {
      if (seen.has(uid)) continue;
      const m = GLOBAL_MEMBER_POOL.find((x) => x.id === uid);
      if (m) {
        seen.add(uid);
        result.push(m);
      }
    }
  }
  return result;
}
