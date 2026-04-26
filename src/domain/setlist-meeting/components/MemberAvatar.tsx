import { cn } from '@/lib/cn';

import type { Member } from '../types';

export interface MemberAvatarProps {
  member: Member | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
};

/**
 * 시드 mock 의 hex avatar 색을 반영한 원형 아바타.
 * 실제 사용자 아바타 도입 시 `Avatar` 로 일괄 치환 예정.
 */
export function MemberAvatar({ member, size = 'md', className }: MemberAvatarProps) {
  const initial = (member?.name?.[0] ?? '?').toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none',
        sizeClasses[size],
        className,
      )}
      style={{ background: member?.avatar ?? 'var(--color-accent)' }}
    >
      {initial}
    </span>
  );
}
