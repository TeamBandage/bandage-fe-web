import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type StatCardAccent = 'accent' | 'success' | 'amber' | 'warn' | 'blue' | 'danger';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: StatCardAccent;
}

const ICON_BG: Record<StatCardAccent, string> = {
  accent: 'bg-accent-dim text-accent',
  success: 'bg-success-dim text-success',
  amber: 'bg-amber-dim text-amber',
  warn: 'bg-warn-dim text-warn',
  blue: 'bg-blue-dim text-blue',
  danger: 'bg-danger-dim text-danger',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'accent',
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-lg',
        'shadow-[0_0_20px_rgba(96,165,250,0.12),0_0_40px_rgba(96,165,250,0.06),inset_0_1px_0_rgba(255,255,255,0.12)]',
        'p-s-4 gap-s-3 flex items-center',
        className,
      )}
      data-slot="stat-card"
      {...props}
    >
      <div
        className={cn('flex h-10 w-10 items-center justify-center rounded-md', ICON_BG[accent])}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground-sub text-micro">{label}</div>
        <div className="text-foreground text-title-lg leading-tight font-bold">{value}</div>
      </div>
    </div>
  );
}
