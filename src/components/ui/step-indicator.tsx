import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface StepIndicatorProps {
  steps: readonly string[];
  /** 0-based current step index. */
  current: number;
  className?: string;
}

/**
 * 다단계 폼 진행 표시기.
 * design/dist/css/components.css .steps / .step / .step__dot / .step__bar 규칙 미러링.
 * - 미완료: bg-card / border-border / text-foreground-muted
 * - 진행중: bg-accent / border-accent / text-white (aria-current=step)
 * - 완료: bg-accent-dim / border-accent / text-accent + check 아이콘
 * - 단계 사이 bar: 완료된 경계는 bg-accent, 그 외 bg-border
 */
export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <ol
      className={cn('gap-s-2 mb-s-6 flex items-center', className)}
      data-slot="step-indicator"
      aria-label="진행 단계"
    >
      {steps.map((label, i) => {
        const state: 'done' | 'active' | 'pending' =
          i < current ? 'done' : i === current ? 'active' : 'pending';
        return (
          <li key={label} className="gap-s-2 flex items-center [&:not(:last-child)]:flex-1">
            <div
              className={cn('gap-s-2 flex items-center')}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <span
                className={cn(
                  'text-caption flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] font-bold transition-all duration-200',
                  state === 'pending' && 'bg-card border-border text-foreground-muted',
                  state === 'active' && 'bg-accent border-accent text-foreground',
                  state === 'done' && 'bg-accent-dim border-accent text-accent',
                )}
                aria-label={`${i + 1}단계${state === 'done' ? ' (완료)' : state === 'active' ? ' (진행 중)' : ''}`}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-caption whitespace-nowrap',
                  state === 'active' ? 'text-foreground font-semibold' : 'text-foreground-muted',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn('h-[2px] flex-1 rounded-sm', i < current ? 'bg-accent' : 'bg-border')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
