import type { HTMLAttributes } from 'react';

import type { BandRole } from '@/global/types';
import { cn } from '@/lib/cn';

export interface RoleBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  role: BandRole;
}

const ROLE_LABEL: Record<BandRole, string> = {
  LEADER: '리더',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

const ROLE_CLASSES: Record<BandRole, string> = {
  // amber 계열
  LEADER: 'bg-amber-dim text-amber border-transparent',
  // accent(blue) 계열
  ADMIN: 'bg-accent-dim text-accent border-transparent',
  // muted gray
  MEMBER: 'bg-card-hover text-foreground-sub border-border',
};

/**
 * 밴드 역할 배지.
 * --color-role-* 의 의도에 맞춰 LEADER(amber) / ADMIN(accent) / MEMBER(muted) 색상 사용.
 */
export function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-pill text-micro inline-flex items-center border px-2 py-0.5 font-semibold',
        ROLE_CLASSES[role],
        className,
      )}
      data-slot="role-badge"
      data-role={role}
      {...props}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
