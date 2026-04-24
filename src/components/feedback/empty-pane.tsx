import { Inbox, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface EmptyPaneProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

/**
 * PaneDetail(마스터-디테일 우측) 플레이스홀더.
 * "왼쪽에서 항목을 선택하세요" 류의 idle 상태를 표현.
 */
export function EmptyPane({
  icon: Icon = Inbox,
  title,
  description,
  className,
  ...props
}: EmptyPaneProps) {
  return (
    <div
      className={cn(
        'p-s-8 flex h-full flex-col items-center justify-center text-center',
        className,
      )}
      data-slot="empty-pane"
      {...props}
    >
      <div
        className="bg-card border-border mb-s-5 flex h-16 w-16 items-center justify-center rounded-lg border"
        aria-hidden="true"
      >
        <Icon className="text-foreground-muted h-8 w-8" />
      </div>
      <h3 className="text-foreground text-subtitle mb-s-2 font-bold">{title}</h3>
      {description !== undefined && (
        <p className="text-foreground-muted text-caption max-w-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
}
