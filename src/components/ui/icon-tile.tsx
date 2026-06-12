import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type IconTileSize = 'sm' | 'md' | 'lg';
export type IconTileTone = 'accent' | 'success' | 'amber' | 'warn' | 'blue' | 'card';

export interface IconTileProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
  size?: IconTileSize;
  tone?: IconTileTone;
}

const sizeClasses: Record<IconTileSize, string> = {
  sm: 'h-8 w-8 rounded-sm [&>svg]:h-3.5 [&>svg]:w-3.5',
  md: 'h-10 w-10 rounded-md [&>svg]:h-[18px] [&>svg]:w-[18px]',
  lg: 'h-14 w-14 rounded-[14px] [&>svg]:h-[22px] [&>svg]:w-[22px]',
};

const toneClasses: Record<IconTileTone, string> = {
  accent: 'bg-accent-dim text-accent',
  success: 'bg-success-dim text-success',
  amber: 'bg-amber-dim text-amber',
  warn: 'bg-warn-dim text-warn',
  blue: 'bg-blue-dim text-blue',
  card: 'bg-card text-foreground-sub',
};

export function IconTile({
  icon,
  size = 'md',
  tone = 'accent',
  className,
  ...props
}: IconTileProps) {
  return (
    <span
      data-slot="icon-tile"
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors',
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon}
    </span>
  );
}
