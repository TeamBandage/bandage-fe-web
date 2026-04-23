import { useState, type ImgHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: AvatarSize;
  fallback?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-14 w-14 text-base',
};

function initialsOf(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({ size = 'md', src, alt, fallback, className, ...props }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <span
      className={cn(
        'bg-card-hover text-foreground-sub rounded-pill inline-flex items-center justify-center overflow-hidden font-semibold select-none',
        sizeClasses[size],
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- 프로필 아바타는 다양한 외부 origin을 허용해야 하므로 next/image 대신 native img 사용
        <img
          src={src}
          alt={alt ?? fallback ?? ''}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
          {...props}
        />
      ) : (
        <span aria-label={alt ?? fallback ?? '아바타'}>
          {fallback ? initialsOf(fallback) : '?'}
        </span>
      )}
    </span>
  );
}
