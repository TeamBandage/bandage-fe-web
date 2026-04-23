import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: ContainerMaxWidth;
  padding?: boolean;
}

const maxWidthClasses: Record<ContainerMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export function Container({
  maxWidth = 'lg',
  padding = true,
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full', maxWidthClasses[maxWidth], padding && 'px-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
