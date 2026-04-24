import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type PaneListWidth = 'list' | 'band-list';

export interface PaneListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  width?: PaneListWidth;
  header?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}

const widthStyle: Record<PaneListWidth, CSSProperties> = {
  list: { width: 'var(--list-pane-w)' },
  'band-list': { width: 'var(--band-list-pane-w)' },
};

/**
 * 마스터-디테일의 좌측 목록 pane.
 * width="list" => 340px, width="band-list" => 360px.
 * 내부 구조: header (고정, border-b) + body (flex-1 overflow-y-auto).
 */
export function PaneList({
  width = 'list',
  header,
  children,
  bodyClassName,
  className,
  style,
  ...props
}: PaneListProps) {
  return (
    <aside
      className={cn(
        'border-border bg-surface flex shrink-0 flex-col border-r',
        'max-lg:w-full',
        className,
      )}
      style={{ ...widthStyle[width], ...style }}
      data-slot="pane-list"
      data-width={width}
      {...props}
    >
      {header !== undefined && (
        <div className="border-border p-s-5 shrink-0 border-b" data-slot="pane-list-header">
          {header}
        </div>
      )}
      <div
        className={cn('px-s-3 py-s-3 flex-1 overflow-y-auto', bodyClassName)}
        data-slot="pane-list-body"
      >
        {children}
      </div>
    </aside>
  );
}
