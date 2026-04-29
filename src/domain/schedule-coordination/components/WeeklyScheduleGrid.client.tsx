'use client';

import type { CSSProperties, DragEvent, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { dayOfWeek, slotToTime } from '../utils';

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const SLOT_HEIGHT = 22;
export const TIME_COL_WIDTH = 56;

export interface WeeklyScheduleGridProps {
  days: string[];
  slotStart: number;
  slotEnd: number;
  /** 회의 가용 범위 안의 일자만 활성. 외부는 비활성(disabled 셀로 표시). */
  isInWindow?: (date: string) => boolean;
  /** 셀 단위 추가 렌더 — 히트맵, 드롭존 등. */
  renderCell?: (args: {
    date: string;
    slot: number;
    inWindow: boolean;
    isHourBoundary: boolean;
  }) => ReactNode;
  /** 추가 오버레이 — 블록 등 grid row span 사용. */
  overlay?: ReactNode;
  /** 셀 onDragOver / onDragLeave / onDrop 핸들러. */
  onCellDragOver?: (date: string, slot: number) => (e: DragEvent) => void;
  onCellDragLeave?: () => void;
  onCellDrop?: (date: string, slot: number) => (e: DragEvent) => void;
  /** 셀 클릭 핸들러 — 입력 모달 등 read+write 그리드용. */
  onCellClick?: (date: string, slot: number) => void;
  /** 추가 셀 클래스 함수 — hover/highlight 상태. */
  cellClassName?: (date: string, slot: number, inWindow: boolean) => string | undefined;
  /** export 용 ref (캡처 대상). */
  gridRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

/** 행=시간 슬롯, 열=일자. 좌측 시간 라벨 sticky, 상단 일자 헤더 sticky. */
export function WeeklyScheduleGrid({
  days,
  slotStart,
  slotEnd,
  isInWindow = () => true,
  renderCell,
  overlay,
  onCellDragOver,
  onCellDragLeave,
  onCellDrop,
  onCellClick,
  cellClassName,
  gridRef,
  className,
}: WeeklyScheduleGridProps) {
  const slotCount = slotEnd - slotStart;
  const slots = Array.from({ length: slotCount }, (_, i) => slotStart + i);
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${days.length}, minmax(80px, 1fr))`,
    gridTemplateRows: `36px repeat(${slotCount}, ${SLOT_HEIGHT}px)`,
  };

  return (
    <div
      ref={gridRef}
      className={cn('border-border bg-card flex-1 overflow-auto rounded-md border', className)}
    >
      <div className="grid min-w-fit" style={gridStyle}>
        {/* 코너 */}
        <div
          className="bg-surface border-border sticky top-0 left-0 z-30 border-r border-b"
          style={{ gridRow: 1, gridColumn: 1 }}
        />

        {/* 일자 헤더 */}
        {days.map((d, i) => {
          const dow = dayOfWeek(d);
          const isWeekend = dow === 0 || dow === 6;
          const inWindow = isInWindow(d);
          return (
            <div
              key={`h-${d}-${i}`}
              className={cn(
                'bg-surface border-border sticky top-0 z-20 border-b px-2 py-1 text-center font-mono',
                !inWindow && 'opacity-30',
                isWeekend && 'text-amber',
              )}
              style={{ gridRow: 1, gridColumn: i + 2 }}
            >
              <div className="text-micro font-bold">{DOW_LABELS[dow]}</div>
              <div className="text-caption font-bold">{d.slice(5)}</div>
            </div>
          );
        })}

        {/* 시간 라벨 — 정시(짝수 슬롯)만 노출. */}
        {slots.map((s, idx) => (
          <div
            key={`tl-${s}`}
            className="bg-surface border-border sticky left-0 z-10 border-r px-1 text-right font-mono"
            style={{
              gridRow: idx + 2,
              gridColumn: 1,
              lineHeight: `${SLOT_HEIGHT}px`,
            }}
          >
            {s % 2 === 0 ? (
              <span className="text-foreground-muted text-micro">{slotToTime(s)}</span>
            ) : null}
          </div>
        ))}

        {/* 셀 */}
        {slots.map((s, sIdx) =>
          days.map((d, dIdx) => {
            const inWindow = isInWindow(d);
            const isHourBoundary = s % 2 === 0;
            const extraClass = cellClassName?.(d, s, inWindow);
            return (
              <div
                key={`c-${d}-${s}`}
                role={onCellClick && inWindow ? 'button' : undefined}
                tabIndex={onCellClick && inWindow ? 0 : undefined}
                onDragOver={inWindow ? onCellDragOver?.(d, s) : undefined}
                onDragLeave={inWindow ? onCellDragLeave : undefined}
                onDrop={inWindow ? onCellDrop?.(d, s) : undefined}
                onClick={inWindow ? () => onCellClick?.(d, s) : undefined}
                onKeyDown={
                  onCellClick && inWindow
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCellClick(d, s);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'border-border border-r transition-colors',
                  isHourBoundary && 'border-t',
                  !inWindow && 'bg-surface/40',
                  onCellClick && inWindow && 'hover:bg-card-hover cursor-pointer',
                  extraClass,
                )}
                style={{ gridRow: sIdx + 2, gridColumn: dIdx + 2 }}
              >
                {renderCell?.({ date: d, slot: s, inWindow, isHourBoundary })}
              </div>
            );
          }),
        )}

        {overlay}
      </div>
    </div>
  );
}
