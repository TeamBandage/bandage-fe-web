'use client';

import type { ReactNode } from 'react';

import type { BandRole } from '@/global/types';

import { useBandRole } from './useBandRole';

const roleHierarchy: Record<BandRole, number> = {
  LEADER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

type RoleGuardProps = {
  bandId: string;
  role: BandRole;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * 지정 밴드에서 현재 유저의 역할이 최소 요구 역할 이상일 때만 children 을 렌더합니다.
 * 로딩 중에는 fallback 을 반환해 UI 깜빡임을 방지합니다.
 */
export function RoleGuard({ bandId, role, children, fallback = null }: RoleGuardProps) {
  const { data: userRole } = useBandRole(bandId);
  if (!userRole) return <>{fallback}</>;
  if (roleHierarchy[userRole] < roleHierarchy[role]) return <>{fallback}</>;
  return <>{children}</>;
}

/** 헬퍼: 현재 유저 역할이 최소 요구 역할 이상인지 boolean */
export function hasRole(userRole: BandRole | null | undefined, minRole: BandRole) {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}
