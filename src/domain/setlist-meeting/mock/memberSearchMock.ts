/**
 * 멤버 검색 mock — 글로벌 멤버 풀(밴드 무관). 실제 API: GET /api/v1/members/search?q=
 */
import type { Member } from '../types';

import { SEED_MEMBERS } from './seed';

const EXTRA_MEMBERS: Member[] = [
  {
    id: 'u8',
    name: '박지윤',
    role: '보컬',
    avatar: '#F472B6',
    email: 'jiyun@bandage.dev',
  },
  {
    id: 'u9',
    name: '오세훈',
    role: '베이스',
    avatar: '#22C55E',
    email: 'sehoon@bandage.dev',
  },
  {
    id: 'u10',
    name: '강현우',
    role: '드럼',
    avatar: '#A855F7',
    email: 'hyunwoo@bandage.dev',
  },
  {
    id: 'u11',
    name: '윤다은',
    role: '키보드',
    avatar: '#0EA5E9',
    email: 'daeun@bandage.dev',
  },
  {
    id: 'u12',
    name: '한태규',
    role: '기타',
    avatar: '#F97316',
    email: 'taegyu@bandage.dev',
  },
];

export const GLOBAL_MEMBER_POOL: Member[] = [...SEED_MEMBERS, ...EXTRA_MEMBERS];

export function searchMockMembers(query: string, limit = 20): Member[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return GLOBAL_MEMBER_POOL.filter(
    (m) => m.name.toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q),
  ).slice(0, limit);
}
