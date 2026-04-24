import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface PaneDetailProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  bodyClassName?: string;
}

/**
 * 마스터-디테일의 우측 상세 pane.
 * 외곽은 column flex, 본문은 flex-1 overflow-y-auto + padding 24/28px.
 * Topbar 는 이 컴포넌트 밖에서 상단에 sticky 로 배치되는 것을 기본 가정.
 */
export function PaneDetail({ className, bodyClassName, children, ...props }: PaneDetailProps) {
  return (
    <section
      className={cn('flex flex-1 flex-col overflow-hidden', className)}
      data-slot="pane-detail"
      {...props}
    >
      <div
        className={cn('px-s-5 py-s-6 flex-1 overflow-y-auto lg:px-7', bodyClassName)}
        data-slot="pane-detail-body"
      >
        {children}
      </div>
    </section>
  );
}
