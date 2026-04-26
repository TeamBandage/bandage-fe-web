'use client';

import { CalendarDays } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from 'react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { YearMonthPicker } from '@/components/ui/year-month-picker';
import { cn } from '@/lib/cn';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

type ParsedDate = { y: number; mo: number; d: number; h: number; mi: number };

function parse(value: string): ParsedDate | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: m[4] ? Number(m[4]) : 19,
    mi: m[5] ? Number(m[5]) : 0,
  };
}

function format(p: ParsedDate): string {
  return `${p.y}-${pad(p.mo)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`;
}

function formatDisplay(p: ParsedDate): string {
  const date = new Date(p.y, p.mo - 1, p.d);
  const dow = DOW[date.getDay()];
  return `${p.y}.${pad(p.mo)}.${pad(p.d)} (${dow}) ${pad(p.h)}:${pad(p.mi)}`;
}

function todayParts(): ParsedDate {
  const d = new Date();
  return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: 19, mi: 0 };
}

function offsetDay(base: ParsedDate, offset: number): ParsedDate {
  const d = new Date(base.y, base.mo - 1, base.d);
  d.setDate(d.getDate() + offset);
  return { ...base, y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate() };
}

function sameDay(a: ParsedDate, b: ParsedDate) {
  return a.y === b.y && a.mo === b.mo && a.d === b.d;
}

function dateLT(a: ParsedDate, b: ParsedDate) {
  if (a.y !== b.y) return a.y < b.y;
  if (a.mo !== b.mo) return a.mo < b.mo;
  return a.d < b.d;
}

function genMinutes(step: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < 60; m += step) out.push(m);
  return out;
}

export interface DateTimePickerProps {
  /** "yyyy-MM-dd HH:mm" 형식 또는 빈 문자열 */
  value: string;
  onChange: (next: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** 분 단위 step (기본 5) */
  step?: number;
  /** 트리거 placeholder (기본 "날짜와 시간 선택") */
  placeholder?: string;
  /** 지난 날짜 비활성 (기본 true) */
  futureOnly?: boolean;
  'aria-label'?: string;
}

/**
 * 캘린더 + iOS 휠 시간 선택을 모달로 제공. design/handoff/specs/07-datetime-picker.md 일치.
 * 값 포맷은 "yyyy-MM-dd HH:mm" 으로 backend / form 스키마와 동일.
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
  placeholder = '날짜와 시간 선택',
  futureOnly = true,
  'aria-label': ariaLabel,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parse(value);
  const today = useMemo(todayParts, []);
  const minDate = futureOnly ? today : null;

  const initial = parsed ?? today;
  const [draft, setDraft] = useState<ParsedDate>(initial);
  const [view, setView] = useState({ y: initial.y, mo: initial.mo });

  // 모달 열릴 때마다 현재 value 로 draft 초기화
  useEffect(() => {
    if (open) {
      const init = parse(value) ?? today;
      setDraft(init);
      setView({ y: init.y, mo: init.mo });
    }
  }, [open, value, today]);

  const minutes = useMemo(() => genMinutes(step), [step]);
  const closestMinute = useMemo(
    () => minutes.reduce((a, b) => (Math.abs(b - draft.mi) < Math.abs(a - draft.mi) ? b : a)),
    [minutes, draft.mi],
  );

  const navMonth = useCallback((dir: number) => {
    setView((prev) => {
      let { y, mo } = prev;
      mo += dir;
      if (mo > 12) {
        mo = 1;
        y += 1;
      }
      if (mo < 1) {
        mo = 12;
        y -= 1;
      }
      return { y, mo };
    });
  }, []);

  const quickDay = useCallback(
    (offset: number) => {
      const base = offsetDay(today, offset);
      setDraft((prev) => ({ ...prev, y: base.y, mo: base.mo, d: base.d }));
      setView({ y: base.y, mo: base.mo });
    },
    [today],
  );

  const tomorrow = useMemo(() => offsetDay(today, 1), [today]);
  const nextWeek = useMemo(() => offsetDay(today, 7), [today]);

  const confirm = () => {
    onChange(format({ ...draft, mi: closestMinute }));
    setOpen(false);
  };

  const triggerLabel = parsed ? formatDisplay(parsed) : placeholder;

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        data-slot="date-time-picker-trigger"
        className={cn(
          'bg-card border-border px-s-3 py-s-2 text-body flex w-full items-center justify-between gap-2 rounded-md border-[1.5px] text-left',
          'focus-visible:border-accent focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          parsed ? 'text-foreground font-semibold' : 'text-foreground-muted font-normal',
          className,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <CalendarDays className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
      </button>

      {/* RHF 호환: yyyy-MM-dd HH:mm 문자열을 hidden 으로 동기화 */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-bg max-w-[620px] gap-0 rounded-2xl border p-0"
          srOnlyTitle="날짜와 시간 선택"
          hideCloseButton
        >
          {/* 빠른 선택 칩 */}
          <div className="border-border gap-s-2 px-s-5 py-s-3 flex flex-wrap border-b">
            <Chip interactive selected={sameDay(draft, today)} onClick={() => quickDay(0)}>
              오늘
            </Chip>
            <Chip interactive selected={sameDay(draft, tomorrow)} onClick={() => quickDay(1)}>
              내일
            </Chip>
            <Chip interactive selected={sameDay(draft, nextWeek)} onClick={() => quickDay(7)}>
              다음 주
            </Chip>
          </div>

          {/* 캘린더 + 시간 휠 */}
          <div className="flex min-h-[320px] flex-col sm:flex-row">
            <Calendar
              viewYear={view.y}
              viewMonth={view.mo}
              selected={draft}
              minDate={minDate}
              onNav={navMonth}
              onPick={(p) => setDraft((prev) => ({ ...prev, y: p.y, mo: p.mo, d: p.d }))}
              onSetYM={({ year, month }) => setView({ y: year, mo: month })}
            />
            <div className="border-border px-s-4 py-s-4 flex flex-col border-t sm:w-[240px] sm:border-t-0 sm:border-l">
              <div className="text-foreground-muted text-micro mb-s-2 text-center font-semibold tracking-wider uppercase">
                시간 선택
              </div>
              {/* 듀얼 모드: 직접 타이핑 가능한 input + 보조 휠 */}
              <div className="mb-s-3 gap-s-2 flex items-center justify-center">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={pad(draft.h)}
                  onChange={(e) => {
                    const h = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                    setDraft((prev) => ({ ...prev, h }));
                  }}
                  className="bg-card border-border text-foreground text-title focus-visible:border-accent w-16 rounded-md border-2 px-2 py-1 text-center font-bold tabular-nums outline-none"
                  aria-label="시 직접 입력"
                />
                <span className="text-foreground-sub text-title font-bold">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={pad(draft.mi)}
                  onChange={(e) => {
                    const mi = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                    setDraft((prev) => ({ ...prev, mi }));
                  }}
                  className="bg-card border-border text-foreground text-title focus-visible:border-accent w-16 rounded-md border-2 px-2 py-1 text-center font-bold tabular-nums outline-none"
                  aria-label="분 직접 입력"
                />
              </div>
              <div className="gap-s-2 flex items-end justify-center">
                <Wheel
                  label="시"
                  values={HOURS}
                  value={draft.h}
                  onChange={(h) => setDraft((prev) => ({ ...prev, h }))}
                />
                <div className="text-foreground-sub mb-12 text-lg font-bold">:</div>
                <Wheel
                  label="분"
                  values={minutes}
                  value={closestMinute}
                  onChange={(mi) => setDraft((prev) => ({ ...prev, mi }))}
                />
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="bg-surface border-border px-s-5 py-s-3 flex items-center justify-between border-t">
            <div className="text-foreground text-caption font-semibold">{formatDisplay(draft)}</div>
            <div className="gap-s-2 flex">
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  취소
                </Button>
              </DialogClose>
              <Button size="sm" onClick={confirm}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CalendarProps {
  viewYear: number;
  viewMonth: number;
  selected: ParsedDate;
  minDate: ParsedDate | null;
  onNav: (dir: number) => void;
  onPick: (p: { y: number; mo: number; d: number }) => void;
  /** YearMonthPicker 의 직접 변경. */
  onSetYM?: (next: { year: number; month: number }) => void;
}

function Calendar({
  viewYear,
  viewMonth,
  selected,
  minDate,
  onNav,
  onPick,
  onSetYM,
}: CalendarProps) {
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const today = useMemo(todayParts, []);
  const [ymOpen, setYmOpen] = useState(false);

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-s-4 py-s-4 flex-1">
      <div className="mb-s-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => onNav(-1)}
          className="bg-card border-border text-foreground hover:bg-card-hover flex h-7 w-7 items-center justify-center rounded-md border text-base"
        >
          ‹
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => onSetYM && setYmOpen((v) => !v)}
            className="text-foreground text-body hover:text-accent inline-flex items-center gap-1 font-bold transition-colors"
            aria-haspopup="dialog"
            aria-expanded={ymOpen}
            aria-label="연도와 월 빠른 선택 열기"
          >
            {viewYear}년 {viewMonth}월{onSetYM && <span aria-hidden="true">▾</span>}
          </button>
          {ymOpen && onSetYM && (
            <YearMonthPicker
              year={viewYear}
              month={viewMonth}
              onChange={onSetYM}
              onClose={() => setYmOpen(false)}
            />
          )}
        </div>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => onNav(1)}
          className="bg-card border-border text-foreground hover:bg-card-hover flex h-7 w-7 items-center justify-center rounded-md border text-base"
        >
          ›
        </button>
      </div>

      <div className="mb-s-1 grid grid-cols-7 gap-0.5">
        {DOW.map((label, i) => (
          <div
            key={label}
            className={cn(
              'text-micro text-center font-semibold',
              'py-s-1',
              i === 0 ? 'text-danger' : i === 6 ? 'text-success' : 'text-foreground-muted',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, idx) => {
          if (d === null) return <div key={`pad-${idx}`} className="aspect-square" />;
          const cellP = { y: viewYear, mo: viewMonth, d };
          const isSel = sameDay(cellP as ParsedDate, selected);
          const isToday = sameDay(cellP as ParsedDate, today);
          const isPast = !!minDate && dateLT(cellP as ParsedDate, minDate);
          const dow = (firstDow + d - 1) % 7;
          const dayColor =
            dow === 0 ? 'text-danger' : dow === 6 ? 'text-success' : 'text-foreground';
          return (
            <button
              key={`d-${d}`}
              type="button"
              disabled={isPast}
              onClick={() => onPick(cellP)}
              className={cn(
                'text-body relative flex aspect-square items-center justify-center rounded-md transition-colors',
                isSel && 'bg-accent text-foreground font-bold',
                !isSel && isToday && 'bg-accent-soft font-bold',
                !isSel && !isToday && dayColor,
                !isSel && !isPast && 'hover:bg-card-hover',
                isPast && 'text-foreground-muted cursor-not-allowed opacity-40',
              )}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSel}
              aria-label={`${viewYear}년 ${viewMonth}월 ${d}일`}
            >
              {d}
              {isToday && !isSel && (
                <span className="bg-accent absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface WheelProps {
  label: string;
  values: number[];
  value: number;
  onChange: (v: number) => void;
}

const ITEM_H = 32;

function Wheel({ label, values, value, onChange }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const idx = Math.max(0, values.indexOf(value));

  // 외부 value 변경 시 스크롤 위치 동기화 (사용자 스크롤 중에는 잠금)
  useEffect(() => {
    if (ref.current && !lockRef.current) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, [idx]);

  const onScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      lockRef.current = true;
      const i = Math.round(e.currentTarget.scrollTop / ITEM_H);
      const next = values[Math.max(0, Math.min(values.length - 1, i))];
      if (next !== undefined && next !== value) {
        onChange(next);
      }
      window.clearTimeout((ref.current as unknown as { _t?: number })?._t);
      const t = window.setTimeout(() => {
        lockRef.current = false;
      }, 150);
      (ref.current as unknown as { _t?: number })._t = t;
    },
    [onChange, value, values],
  );

  const onKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = values[Math.max(0, idx - 1)];
        if (next !== undefined) onChange(next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = values[Math.min(values.length - 1, idx + 1)];
        if (next !== undefined) onChange(next);
      }
    },
    [idx, onChange, values],
  );

  return (
    <div className="flex-1">
      <div className="text-foreground-muted text-micro mb-s-1 text-center font-semibold">
        {label}
      </div>
      <div className="bg-card border-border relative overflow-hidden rounded-md border">
        {/* 중앙 하이라이트 밴드 */}
        <div
          className="border-accent bg-accent-dim pointer-events-none absolute right-0 left-0 z-10 border-y"
          style={{ top: ITEM_H * 2, height: ITEM_H }}
          aria-hidden="true"
        />
        <div
          ref={ref}
          role="listbox"
          tabIndex={0}
          aria-label={label}
          onScroll={onScroll}
          onKeyDown={onKey}
          className="scrollbar-hide focus-visible:ring-accent focus-visible:rounded-md focus-visible:ring-2 focus-visible:outline-none"
          style={{
            height: ITEM_H * 5,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            paddingTop: ITEM_H * 2,
            paddingBottom: ITEM_H * 2,
            scrollbarWidth: 'none',
          }}
        >
          {values.map((v) => (
            <div
              key={v}
              role="option"
              aria-selected={v === value}
              className={cn(
                'flex items-center justify-center text-base font-semibold',
                v === value ? 'text-accent' : 'text-foreground-sub',
              )}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            >
              {pad(v)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** datetime-local 값("YYYY-MM-DDTHH:mm") ↔ "yyyy-MM-dd HH:mm" 변환 (구 호출부 호환) */
export function toKstString(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  return datetimeLocal.replace('T', ' ');
}
