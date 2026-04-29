'use client';

import { useCallback, useMemo, useState } from 'react';

import { addDays, enumerateDays, startOfWeek } from '../utils';

interface UseScheduleViewOptions {
  from: string;
  to: string;
}

export interface ScheduleViewState {
  /** 회의 전체 가용 일자 (from~to inclusive). */
  allDays: string[];
  /** compact=true: 1주 이내 → 모든 일자 단일 컬럼. compact=false: 1주 초과 → Mon-Sun 페이지네이션. */
  compact: boolean;
  /** 현재 보이는 일자 컬럼들 (compact 시 allDays, week 시 7일). */
  visibleDays: string[];
  /** 회의 가용 범위 안에 있는지 — UI 에서 disabled 처리. */
  isInWindow: (date: string) => boolean;
  /** 현재 주차의 라벨 — 'YYYY-MM-DD (요일) ~ MM-DD (요일)' */
  rangeLabel: string;
  /** week 모드에서만 활성. */
  prev: () => void;
  next: () => void;
  today: () => void;
  /** week 모드의 anchor (현재 보이는 주의 월요일). */
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
  const compact = allDays.length > 0 && allDays.length <= 7;

  const initialAnchor = useMemo(() => {
    if (allDays.length === 0) return from || new Date().toISOString().slice(0, 10);
    if (compact) return allDays[0]!;
    return startOfWeek(allDays[0]!);
  }, [allDays, compact, from]);
  const [anchor, setAnchor] = useState(initialAnchor);

  const visibleDays = useMemo(() => {
    if (compact) return allDays;
    if (allDays.length === 0) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  }, [compact, allDays, anchor]);

  const allDaysSet = useMemo(() => new Set(allDays), [allDays]);
  const isInWindow = useCallback((d: string) => allDaysSet.has(d), [allDaysSet]);

  const rangeLabel = useMemo(() => {
    if (visibleDays.length === 0) return '';
    if (compact) {
      return visibleDays.map(fmt).join(', ');
    }
    const first = visibleDays[0]!;
    const last = visibleDays[visibleDays.length - 1]!;
    const ym = first.slice(0, 4);
    return `${ym}-${fmt(first)} ~ ${fmt(last)}`;
  }, [visibleDays, compact]);

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
    const t = new Date().toISOString().slice(0, 10);
    if (allDaysSet.has(t)) {
      setAnchor(startOfWeek(t));
    } else {
      setAnchor(firstWeekStart);
    }
  }, [compact, allDays, allDaysSet, firstWeekStart]);

  return {
    allDays,
    compact,
    visibleDays,
    isInWindow,
    rangeLabel,
    prev,
    next,
    today,
    anchor,
    canPrev: !compact && anchor > firstWeekStart,
    canNext: !compact && anchor < lastWeekStart,
  };
}
