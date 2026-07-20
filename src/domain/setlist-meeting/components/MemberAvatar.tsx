import { useState } from 'react';

import { normalizeProfileImgUrl } from '@/global/upload';
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

export function MemberAvatar({ member, size = 'md', className }: MemberAvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = (member?.name?.[0] ?? '?').toUpperCase();
  const src = normalizeProfileImgUrl(member?.profileImg);
  const showImage = src && !errored;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white select-none',
        sizeClasses[size],
        className,
      )}
      style={showImage ? undefined : { background: member?.avatar ?? 'var(--color-border-hi)' }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- 다양한 외부 origin 프로필 이미지를 허용해야 하므로 native img 사용
        <img
          src={src}
          alt={member?.name ?? ''}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
