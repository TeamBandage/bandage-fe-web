import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type SkeletonRadius = 'sm' | 'md' | 'lg' | 'pill';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: SkeletonRadius;
}

const radiusClasses: Record<SkeletonRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  pill: 'rounded-pill',
};

export function Skeleton({ rounded = 'md', className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-card-hover animate-pulse', radiusClasses[rounded], className)}
      {...props}
    />
  );
}
