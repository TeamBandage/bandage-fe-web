'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import type { ViewUnit } from '../utils';

const UNIT_LABELS: Record<ViewUnit, string> = {
  day: '일',
  week: '주',
  month: '월',
};

interface ViewUnitToggleProps {
  unit: ViewUnit;
  recommended?: ViewUnit;
  onChange: (u: ViewUnit) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  /** 현재 뷰포트 라벨 — 'YYYY-MM-DD' 또는 'YYYY-MM' 등. */
  anchorLabel?: string;
  className?: string;
}

/**
 * Task 3 — 일/주/월 단위 토글 + 좌우 이동 + '오늘로' 단축.
 * 추천 단위와 다르면 'auto' 표시.
 */
export function ViewUnitToggle({
  unit,
  recommended,
  onChange,
  onPrev,
  onNext,
  onToday,
  anchorLabel,
  className,
}: ViewUnitToggleProps) {
  const units: ViewUnit[] = ['day', 'week', 'month'];
  return (
    <div className={cn('gap-s-2 flex flex-wrap items-center', className)}>
      <div
        role="radiogroup"
        aria-label="시각화 단위"
        className="bg-card border-border inline-flex rounded-md border p-0.5"
      >
        {units.map((u) => {
          const active = u === unit;
          return (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(u)}
              className={cn(
                'text-micro px-s-2 rounded py-1 font-bold transition-colors',
                active
                  ? 'bg-accent text-bg shadow-sm'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {UNIT_LABELS[u]}
            </button>
          );
        })}
      </div>
      {recommended && recommended !== unit && (
        <span className="text-foreground-muted text-micro">추천 {UNIT_LABELS[recommended]}</span>
      )}
      <div className="gap-s-1 flex items-center">
        <Button size="sm" variant="ghost" onClick={onPrev} aria-label="이전">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {anchorLabel && (
          <span className="text-foreground text-caption px-s-2 font-mono font-bold">
            {anchorLabel}
          </span>
        )}
        <Button size="sm" variant="ghost" onClick={onNext} aria-label="다음">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onToday}>
          오늘
        </Button>
      </div>
    </div>
  );
}
