'use client';

import { cn } from '@/lib/cn';

export interface UnderlineTabItem<T extends string> {
  id: T;
  label: string;
  /** 옵션 — 우측 상단 뱃지(개수 등). */
  badge?: string | number;
  disabled?: boolean;
}

export interface UnderlineTabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  items: ReadonlyArray<UnderlineTabItem<T>>;
  /** 가득 채운 폭으로 균등 분배(equal). 기본 'auto' 는 자연 폭. */
  width?: 'auto' | 'equal';
  className?: string;
}

/**
 * 합주 일정 조율 좌측 패널 / 일반 영역에서 공통으로 쓰는 언더라인 탭.
 * Task 2 좌측 3탭 구조에서 사용. SchedulingMain 의 로컬 구현을 승격.
 */
export function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
  width = 'auto',
  className,
}: UnderlineTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'border-border gap-s-4 -mb-px flex border-b',
        width === 'equal' && 'w-full',
        className,
      )}
    >
      {items.map((it) => {
        const active = value === it.id;
        const isEqual = width === 'equal';
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${it.id}`}
            disabled={it.disabled}
            onClick={() => onChange(it.id)}
            className={cn(
              'pb-s-2 text-caption gap-s-1 inline-flex items-center justify-center border-b-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              isEqual && 'flex-1',
              active
                ? 'border-accent text-accent'
                : 'text-foreground-muted hover:text-foreground border-transparent',
            )}
          >
            <span>{it.label}</span>
            {it.badge !== undefined && (
              <span
                className={cn(
                  'text-micro px-s-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full font-bold',
                  active ? 'bg-accent-dim text-accent' : 'bg-card text-foreground-muted',
                )}
              >
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
