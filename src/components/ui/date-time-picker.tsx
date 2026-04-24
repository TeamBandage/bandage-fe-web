'use client';

import { useCallback } from 'react';

import { cn } from '@/lib/cn';

export interface DateTimePickerProps {
  /** 제어값: "yyyy-MM-dd HH:mm" 형식. 빈 문자열 허용. */
  value: string;
  onChange: (next: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  step?: number; // minute granularity, default 5
  'aria-label'?: string;
}

function split(value: string): { date: string; hour: string; minute: string } {
  if (!value) return { date: '', hour: '19', minute: '00' };
  const [d, t = '19:00'] = value.split(' ');
  const [h = '19', m = '00'] = t.split(':');
  return { date: d ?? '', hour: h.padStart(2, '0'), minute: m.padStart(2, '0') };
}

function join(date: string, hour: string, minute: string): string {
  if (!date) return '';
  return `${date} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

function genMinutes(step: number): string[] {
  const out: string[] = [];
  for (let m = 0; m < 60; m += step) out.push(String(m).padStart(2, '0'));
  return out;
}

/**
 * datetime-local 대체 UI. date input (브라우저 네이티브 캘린더) + Hour/Minute select 3 분리.
 * 값은 "yyyy-MM-dd HH:mm" KST 문자열로 관리되어 기존 백엔드 계약과 완전 호환.
 */
export function DateTimePicker({
  value,
  onChange,
  id,
  name,
  required,
  disabled,
  className,
  step = 5,
  'aria-label': ariaLabel,
}: DateTimePickerProps) {
  const { date, hour, minute } = split(value);
  const minutes = genMinutes(step);

  const setDate = useCallback(
    (d: string) => onChange(join(d, hour, minute)),
    [hour, minute, onChange],
  );
  const setHour = useCallback(
    (h: string) => onChange(join(date, h, minute)),
    [date, minute, onChange],
  );
  const setMinute = useCallback(
    (m: string) => onChange(join(date, hour, m)),
    [date, hour, onChange],
  );

  return (
    <div
      className={cn('gap-s-2 sm:gap-s-3 grid sm:grid-cols-[1fr_auto_auto]', className)}
      data-slot="date-time-picker"
      aria-label={ariaLabel}
    >
      <input
        type="date"
        id={id}
        required={required}
        disabled={disabled}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={cn(
          'bg-surface border-border px-s-3 py-s-2 text-body rounded-md border',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      />
      <select
        aria-label="시"
        disabled={disabled}
        value={hour}
        onChange={(e) => setHour(e.target.value)}
        className={cn(
          'bg-surface border-border px-s-3 py-s-2 text-body rounded-md border tabular-nums',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        aria-label="분"
        disabled={disabled}
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
        className={cn(
          'bg-surface border-border px-s-3 py-s-2 text-body rounded-md border tabular-nums',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
      {/* 기존 form 스키마(yyyy-MM-dd HH:mm 문자열)와 호환되도록 name 바인딩 */}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

/** datetime-local 값("YYYY-MM-DDTHH:mm") ↔ yyyy-MM-dd HH:mm 상호 변환 유틸 */
export function toKstString(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  return datetimeLocal.replace('T', ' ');
}
