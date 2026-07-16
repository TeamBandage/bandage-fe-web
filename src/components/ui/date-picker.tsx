'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseDate(s: string): { y: number; mo: number; d: number } | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

function fmtDate(y: number, mo: number, d: number): string {
  return `${y}-${pad(mo)}-${pad(d)}`;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  /** true면 표시 라벨에 요일을 붙임 (예: 2026.07.23 (목)). */
  showWeekday?: boolean;
};

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = '날짜 선택',
  className,
  showWeekday = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const parsed = parseDate(value);
  const today = new Date();
  const todayStr = fmtDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.mo ?? today.getMonth() + 1);

  useEffect(() => {
    if (open) {
      const p = parseDate(value);
      const t = new Date();
      setViewYear(p?.y ?? t.getFullYear());
      setViewMonth(p?.mo ?? t.getMonth() + 1);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const popup = document.getElementById('date-picker-popup');
      if (popup?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  const navMonth = (dir: number) => {
    let mo = viewMonth + dir;
    let y = viewYear;
    if (mo > 12) {
      mo = 1;
      y += 1;
    }
    if (mo < 1) {
      mo = 12;
      y -= 1;
    }
    setViewYear(y);
    setViewMonth(mo);
  };

  const pick = (y: number, mo: number, d: number) => {
    onChange(fmtDate(y, mo, d));
    setOpen(false);
  };

  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const displayLabel = parsed
    ? `${parsed.y}.${pad(parsed.mo)}.${pad(parsed.d)}` +
      (showWeekday ? ` (${DOW[new Date(parsed.y, parsed.mo - 1, parsed.d).getDay()]})` : '')
    : placeholder;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'border-border bg-surface flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-[12px]',
          parsed ? 'text-[#d1d5db]' : 'text-foreground-muted',
          className,
        )}
      >
        <span>{displayLabel}</span>
        <CalendarDays className="text-foreground-muted h-3.5 w-3.5 shrink-0" />
      </button>

      {open && pos && (
        <div
          id="date-picker-popup"
          className="bg-card border-border fixed z-[200] w-60 rounded-lg border p-3 shadow-2xl"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navMonth(-1)}
              className="text-foreground-sub hover:text-foreground p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-foreground text-[12px] font-semibold">
              {viewYear}년 {viewMonth}월
            </span>
            <button
              type="button"
              onClick={() => navMonth(1)}
              className="text-foreground-sub hover:text-foreground p-1"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {DOW.map((label, i) => (
              <div
                key={label}
                className={cn(
                  'py-0.5 text-center text-[10px] font-medium',
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-foreground-muted',
                )}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((d, idx) => {
              if (d === null) return <div key={`p-${idx}`} className="aspect-square" />;
              const dateStr = fmtDate(viewYear, viewMonth, d);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              const isDisabled = (min && dateStr < min) || (max && dateStr > max);
              const dow = (firstDow + d - 1) % 7;

              return (
                <button
                  key={d}
                  type="button"
                  disabled={!!isDisabled}
                  onClick={() => pick(viewYear, viewMonth, d)}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md text-[11px] transition-colors',
                    isSelected && 'bg-[#d1d5db] font-bold text-black',
                    !isSelected && isToday && 'font-bold text-[#d1d5db]',
                    !isSelected &&
                      !isToday &&
                      (dow === 0
                        ? 'text-red-400'
                        : dow === 6
                          ? 'text-blue-400'
                          : 'text-foreground'),
                    !isSelected && !isDisabled && 'hover:bg-white/10',
                    isDisabled && 'cursor-not-allowed opacity-30',
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
