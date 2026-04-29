'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface DateRangeNavProps {
  rangeLabel: string;
  compact: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  className?: string;
}

/**
 * 시간표 상단 — 현재 표시 일자/주차 라벨 + 좌/우/오늘 네비게이션.
 * compact (≤ 7일) 일 때는 페이지네이션 버튼 숨김 — 전체 일자가 한 화면에 표시됨.
 */
export function DateRangeNav({
  rangeLabel,
  compact,
  onPrev,
  onNext,
  onToday,
  canPrev = true,
  canNext = true,
  className,
}: DateRangeNavProps) {
  return (
    <div className={cn('gap-s-3 flex flex-wrap items-center', className)}>
      <div className="text-foreground gap-s-2 flex items-center text-base font-bold tabular-nums">
        {!compact && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="이전 주차"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <span className="text-foreground">{rangeLabel}</span>
        {!compact && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onNext}
            disabled={!canNext}
            aria-label="다음 주차"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!compact && (
        <Button size="sm" variant="ghost" onClick={onToday}>
          오늘
        </Button>
      )}
    </div>
  );
}
