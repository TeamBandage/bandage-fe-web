'use client';

import { useCallback, useMemo, useState } from 'react';

import { addDays, enumerateDays, startOfWeek, toLocalISODate } from '../utils';

interface UseScheduleViewOptions {
  from: string;
  to: string;
}

export interface ScheduleViewState {
  allDays: string[];
  compact: boolean;
  visibleDays: string[];
  isInWindow: (date: string) => boolean;
  rangeLabel: string;
  prev: () => void;
  next: () => void;
  today: () => void;
  /** 임의 일자가 속한 주차로 점프 (월요일로 스냅, 가용 범위 밖이면 클램프). */
  goToDate: (date: string) => void;
  anchor: string;
  canPrev: boolean;
  canNext: boolean;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;
function fmt(d: string): string {
  const dow = new Date(`${d}T00:00:00`).getDay();
  return `${d.slice(5)} (${DOW[dow]})`;
}

export function useScheduleView({ from, to }: UseScheduleViewOptions): ScheduleViewState {
  const allDays = useMemo(() => enumerateDays(from, to), [from, to]);
  /** compact: 모든 가용 일자가 같은 ISO week (월~일) 내에 들어감 → 페이지네이션 불필요. */
  const compact = useMemo(() => {
    if (allDays.length === 0) return true;
    const w0 = startOfWeek(allDays[0]!);
    return allDays.every((d) => startOfWeek(d) === w0);
  }, [allDays]);

  const initialAnchor = useMemo(() => {
    if (allDays.length === 0) return from || toLocalISODate(new Date());
    return startOfWeek(allDays[0]!);
  }, [allDays, from]);
  const [anchor, setAnchor] = useState(initialAnchor);

  /** 항상 7컬럼(월~일) 고정. allDays 에 속하지 않는 일자는 isInWindow=false 로 disabled 표기. */
  const visibleDays = useMemo(() => {
    if (allDays.length === 0) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  }, [allDays, anchor]);

  const allDaysSet = useMemo(() => new Set(allDays), [allDays]);
  const isInWindow = useCallback((d: string) => allDaysSet.has(d), [allDaysSet]);

  const rangeLabel = useMemo(() => {
    if (visibleDays.length === 0) return '';
    const first = visibleDays[0]!;
    const last = visibleDays[visibleDays.length - 1]!;
    const ym = first.slice(0, 4);
    return `${ym}-${fmt(first)} ~ ${fmt(last)}`;
  }, [visibleDays]);

  const lastWeekStart = useMemo(() => {
    if (compact || allDays.length === 0) return anchor;
    return startOfWeek(allDays[allDays.length - 1]!);
  }, [compact, allDays, anchor]);

  const firstWeekStart = useMemo(() => {
    if (compact || allDays.length === 0) return anchor;
    return startOfWeek(allDays[0]!);
  }, [compact, allDays, anchor]);

  const prev = useCallback(() => {
    if (compact) return;
    setAnchor((a) => {
      const next = addDays(a, -7);
      return next < firstWeekStart ? a : next;
    });
  }, [compact, firstWeekStart]);

  const next = useCallback(() => {
    if (compact) return;
    setAnchor((a) => {
      const next = addDays(a, 7);
      return next > lastWeekStart ? a : next;
    });
  }, [compact, lastWeekStart]);

  const today = useCallback(() => {
    if (compact || allDays.length === 0) return;
    const t = toLocalISODate(new Date());
    if (allDaysSet.has(t)) {
      setAnchor(startOfWeek(t));
    } else {
      setAnchor(firstWeekStart);
    }
  }, [compact, allDays, allDaysSet, firstWeekStart]);

  const goToDate = useCallback(
    (date: string) => {
      if (allDays.length === 0 || !date) return;
      const target = startOfWeek(date);
      // 가용 범위 밖이면 가까운 경계 주차로 클램프.
      if (target < firstWeekStart) setAnchor(firstWeekStart);
      else if (target > lastWeekStart) setAnchor(lastWeekStart);
      else setAnchor(target);
    },
    [allDays, firstWeekStart, lastWeekStart],
  );

  return {
    allDays,
    compact,
    visibleDays,
    isInWindow,
    rangeLabel,
    prev,
    next,
    today,
    goToDate,
    anchor,
    canPrev: !compact && anchor > firstWeekStart,
    canNext: !compact && anchor < lastWeekStart,
  };
}
