'use client';

import { useEffect, useRef, type CSSProperties, type DragEvent, type ReactNode } from 'react';

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
  /** 셀 hover (pointer enter) — 가능/불가능 인원 패널 갱신 등 (Task 23). */
  onCellHover?: (date: string, slot: number) => void;
  /**
   * 드래그 페인트 핸들러 (when2meet/Sling 스타일).
   * onPaintStart: pointerdown 한 셀에서 호출 — 의도(추가/제거) 결정 시점.
   * onPaintEnter: pointerdown 이후 다른 셀로 진입 시 호출 — 같은 의도로 일괄 적용.
   * 둘 다 제공 시 onCellClick 보다 우선.
   */
  onPaintStart?: (date: string, slot: number) => void;
  onPaintEnter?: (date: string, slot: number) => void;
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
  onCellHover,
  onPaintStart,
  onPaintEnter,
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

  /**
   * 드래그 페인트 진행 중 여부 + 마지막 페인트한 셀 키.
   * - 셀 자체의 onPointerEnter 는 pointer capture / 빠른 드래그 시 누락이 잦아 부적합.
   * - 대신 document.pointermove → elementFromPoint 로 현재 커서 아래 셀을 찾아 일괄 호출.
   */
  const paintingRef = useRef(false);
  const lastPaintedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!onPaintStart) return;
    const onMove = (e: PointerEvent) => {
      if (!paintingRef.current) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;
      const cell = (target as HTMLElement).closest<HTMLElement>('[data-paint-cell]');
      if (!cell) return;
      const d = cell.dataset.cellDate;
      const sStr = cell.dataset.cellSlot;
      if (!d || sStr === undefined) return;
      const key = `${d}__${sStr}`;
      if (lastPaintedRef.current === key) return;
      lastPaintedRef.current = key;
      onPaintEnter?.(d, Number(sStr));
    };
    const onUp = () => {
      paintingRef.current = false;
      lastPaintedRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [onPaintStart, onPaintEnter]);

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
                data-paint-cell={onPaintStart && inWindow ? '1' : undefined}
                data-cell-date={d}
                data-cell-slot={s}
                role={onCellClick || onPaintStart ? (inWindow ? 'button' : undefined) : undefined}
                tabIndex={onCellClick && inWindow ? 0 : undefined}
                onDragOver={inWindow ? onCellDragOver?.(d, s) : undefined}
                onDragLeave={inWindow ? onCellDragLeave : undefined}
                onDrop={inWindow ? onCellDrop?.(d, s) : undefined}
                onMouseEnter={inWindow && onCellHover ? () => onCellHover(d, s) : undefined}
                onClick={
                  inWindow && onCellClick && !onPaintStart ? () => onCellClick(d, s) : undefined
                }
                onPointerDown={
                  inWindow && onPaintStart
                    ? (e) => {
                        if (e.button !== 0) return;
                        // implicit pointer capture 해제 — document.pointermove 핸들러가 담당.
                        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                        paintingRef.current = true;
                        lastPaintedRef.current = `${d}__${s}`;
                        onPaintStart(d, s);
                      }
                    : undefined
                }
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
                  'border-border rounded-none border-r transition-colors',
                  isHourBoundary && 'border-t',
                  !inWindow && 'bg-surface/40',
                  (onCellClick || onPaintStart) &&
                    inWindow &&
                    'hover:bg-accent/40 hover:ring-accent cursor-pointer touch-none select-none hover:ring-2 hover:ring-inset',
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
