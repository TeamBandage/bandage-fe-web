'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';

export interface YearMonthPickerProps {
  /** 현재 표시 연도. */
  year: number;
  /** 현재 표시 월 (1-12). */
  month: number;
  /** 변경 시 호출 — Confirm 단계 없이 즉시 반영. */
  onChange: (next: { year: number; month: number }) => void;
  /** 닫기 콜백 — 외부 클릭/Esc/선택 후 자동 닫기 등. */
  onClose: () => void;
}

/**
 * 캘린더 헤더의 '2026년 4월' 영역 클릭 시 노출되는 빠른 연/월 선택기.
 * - 연도: 현재 ±5년 (12칸 — 4×3 그리드)
 * - 월: 1~12 (4×3 그리드)
 * - 연·월 동시 표시. 선택 시 즉시 onChange + onClose.
 */
export function YearMonthPicker({ year, month, onChange, onClose }: YearMonthPickerProps) {
  const [draftYear, setDraftYear] = useState(year);
  const baseYear = year - 5;
  const years = Array.from({ length: 12 }, (_, i) => baseYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div
      role="dialog"
      aria-label="연도와 월 선택"
      className="bg-bg border-border absolute top-9 left-1/2 z-20 -translate-x-1/2 rounded-md border shadow-lg"
      data-slot="year-month-picker"
    >
      <div className="px-s-4 py-s-3 border-border space-y-s-3 border-b">
        <p className="text-foreground-muted text-micro font-semibold tracking-wider uppercase">
          연도
        </p>
        <ul className="grid grid-cols-4 gap-1">
          {years.map((y) => (
            <li key={y}>
              <button
                type="button"
                onClick={() => setDraftYear(y)}
                aria-pressed={y === draftYear}
                className={cn(
                  'px-s-2 py-s-1 text-caption w-full rounded-md font-semibold transition-colors',
                  y === draftYear
                    ? 'bg-accent text-foreground'
                    : 'text-foreground-sub hover:bg-card',
                )}
              >
                {y}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-s-4 py-s-3 space-y-s-3">
        <p className="text-foreground-muted text-micro font-semibold tracking-wider uppercase">
          월
        </p>
        <ul className="grid grid-cols-4 gap-1">
          {months.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => {
                  onChange({ year: draftYear, month: m });
                  onClose();
                }}
                aria-pressed={m === month && draftYear === year}
                className={cn(
                  'px-s-2 py-s-1 text-caption w-full rounded-md font-semibold transition-colors',
                  m === month && draftYear === year
                    ? 'bg-accent text-foreground'
                    : 'text-foreground-sub hover:bg-card',
                )}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
