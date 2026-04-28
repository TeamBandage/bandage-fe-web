'use client';

import { useCallback, useMemo, useState } from 'react';

import { addDays, getViewUnit, startOfWeek, type ViewUnit } from '../utils';

interface UseScheduleViewUnitOptions {
  from: string;
  to: string;
  /** 사용자 오버라이드 시 자동 추천 무시. */
  initialUnit?: ViewUnit;
  /** 기준 날짜 (default: 오늘). */
  initialAnchor?: string;
}

export interface ScheduleViewUnitState {
  /** 자동 추천 단위 — 기간 길이 기반. */
  recommended: ViewUnit;
  /** 현재 적용 단위 (사용자 오버라이드 우선). */
  unit: ViewUnit;
  /** 사용자가 강제 변경했는지 — 기간이 바뀌어도 유지. */
  overridden: boolean;
  setUnit: (u: ViewUnit) => void;
  resetUnit: () => void;
  /** 현재 뷰포트 시작일 (단위에 따라 day/week/month 시작점). */
  anchor: string;
  setAnchor: (d: string) => void;
  /** 좌/우 이동 (단위만큼). */
  prev: () => void;
  next: () => void;
  /** '오늘로' 점프. */
  today: () => void;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampToRange(date: string, from: string, to: string): string {
  if (date < from) return from;
  if (date > to) return to;
  return date;
}

function snapToUnit(date: string, unit: ViewUnit): string {
  if (unit === 'week') return startOfWeek(date);
  if (unit === 'month') return `${date.slice(0, 7)}-01`;
  return date;
}

export function useScheduleViewUnit({
  from,
  to,
  initialUnit,
  initialAnchor,
}: UseScheduleViewUnitOptions): ScheduleViewUnitState {
  const recommended = useMemo<ViewUnit>(() => getViewUnit(from, to), [from, to]);
  const [overrideUnit, setOverrideUnit] = useState<ViewUnit | null>(initialUnit ?? null);
  const unit = overrideUnit ?? recommended;

  const [anchor, setAnchorRaw] = useState<string>(() => {
    const base = initialAnchor ?? todayString();
    return snapToUnit(clampToRange(base, from, to), unit);
  });

  const setAnchor = useCallback(
    (d: string) => setAnchorRaw(snapToUnit(clampToRange(d, from, to), unit)),
    [from, to, unit],
  );

  const setUnit = useCallback(
    (u: ViewUnit) => {
      setOverrideUnit(u);
      setAnchorRaw((a) => snapToUnit(clampToRange(a, from, to), u));
    },
    [from, to],
  );

  const resetUnit = useCallback(() => setOverrideUnit(null), []);

  // 모든 unit 의 좌/우 이동을 1주(7일) 단위로 통일.
  // day = 단일 컬럼이지만 prev/next 시 1주씩 점프해 같은 요일 이동.
  // month = 1주씩 페이지네이션 (이전/다음 버튼으로 월 내부 이동).
  const step = unit === 'day' ? 1 : 7;

  const prev = useCallback(() => {
    setAnchorRaw((a) => clampToRange(addDays(a, -step), from, to));
  }, [from, to, step]);

  const next = useCallback(() => {
    setAnchorRaw((a) => clampToRange(addDays(a, step), from, to));
  }, [from, to, step]);

  const today = useCallback(() => {
    setAnchorRaw(snapToUnit(clampToRange(todayString(), from, to), unit));
  }, [from, to, unit]);

  return {
    recommended,
    unit,
    overridden: overrideUnit !== null,
    setUnit,
    resetUnit,
    anchor,
    setAnchor,
    prev,
    next,
    today,
  };
}
