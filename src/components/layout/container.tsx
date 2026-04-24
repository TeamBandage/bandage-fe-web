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
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        // 모바일 16px / 태블릿(md >=768) 20px / 데스크톱(lg >=960) 28px
        // design/dist 의 pane-detail 패딩(24/28)과 정렬.
        padding && 'px-s-4 md:px-s-5 lg:px-7',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
