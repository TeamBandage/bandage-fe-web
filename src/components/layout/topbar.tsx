import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface TopbarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

/**
 * 데스크톱 상세 pane 상단 고정 헤더.
 * design/dist/css/layout.css 의 .topbar / .topbar__title / .topbar__breadcrumb / .topbar__actions 대응.
 * 좌측: breadcrumb(선택) + title, 우측: actions 슬롯.
 */
export function Topbar({ title, breadcrumb, actions, className, ...props }: TopbarProps) {
  return (
    <header
      className={cn(
        'bg-surface border-border px-s-5 py-s-4 sticky top-0 z-10 flex min-h-[68px] shrink-0 items-center justify-between border-b lg:px-7',
        className,
      )}
      data-slot="topbar"
      {...props}
    >
      <div className="flex min-w-0 flex-col">
        {breadcrumb !== undefined && (
          <div className="text-foreground-muted text-micro" data-slot="topbar-breadcrumb">
            {breadcrumb}
          </div>
        )}
        <h1 className="text-foreground text-subtitle truncate font-bold" data-slot="topbar-title">
          {title}
        </h1>
      </div>
      {actions !== undefined && (
        <div className="ml-s-4 gap-s-2 flex shrink-0 items-center" data-slot="topbar-actions">
          {actions}
        </div>
      )}
    </header>
  );
}
