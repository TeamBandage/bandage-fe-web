import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type PaneSplitProps = HTMLAttributes<HTMLDivElement>;

/**
 * 데스크톱 마스터-디테일 레이아웃의 좌측(PaneList) / 우측(PaneDetail) 2분할 컨테이너.
 * 내부 scroll 은 각 pane 이 관리하고, 이 컨테이너 자체는 overflow hidden.
 */
export function PaneSplit({ className, children, ...props }: PaneSplitProps) {
  return (
    <div className={cn('flex flex-1 overflow-hidden', className)} data-slot="pane-split" {...props}>
      {children}
    </div>
  );
}
