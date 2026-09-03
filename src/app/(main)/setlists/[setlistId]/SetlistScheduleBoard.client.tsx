'use client';

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronUp,
  Eye,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type UIEvent,
} from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  assignPaletteTones,
  PALETTE_TONES,
  songTone,
} from '@/domain/schedule-coordination/components/palette';
import {
  SLOT_HEIGHT,
  WeeklyScheduleGrid,
} from '@/domain/schedule-coordination/components/WeeklyScheduleGrid.client';
import {
  addDays,
  dayOfWeek,
  enumerateDays,
  slotToTime,
  toLocalISODate,
} from '@/domain/schedule-coordination/utils';
import { useAutoScheduleBoard } from '@/domain/setlist/hooks/useAutoScheduleBoard';
import { useCreateScheduleBoard } from '@/domain/setlist/hooks/useCreateScheduleBoard';
import { useDeleteScheduleBlock } from '@/domain/setlist/hooks/useDeleteScheduleBlock';
import { useDeleteScheduleBoard } from '@/domain/setlist/hooks/useDeleteScheduleBoard';
import { useScheduleBoardPlacements } from '@/domain/setlist/hooks/useScheduleBoardPlacements';
import { useScheduleBoards } from '@/domain/setlist/hooks/useScheduleBoards';
import { useSetScheduleBlockPin } from '@/domain/setlist/hooks/useSetScheduleBlockPin';
import { useSlotAvailabilities } from '@/domain/setlist/hooks/useSlotAvailabilities';
import { useUpdateScheduleBoard } from '@/domain/setlist/hooks/useUpdateScheduleBoard';
import { useUpsertScheduleBlock } from '@/domain/setlist/hooks/useUpsertScheduleBlock';
import type {
  ScheduleAutoScheduleDayOfWeek,
  ScheduleAutoScheduleInterval,
  ScheduleAutoScheduleRequest,
  ScheduleBoardCreateRequest,
} from '@/domain/setlist/types/req';
import type {
  ScheduleBlockResponse,
  ScheduleBoardResponse,
  SetlistTrackResponse,
  SlotAvailabilityResponse,
} from '@/domain/setlist/types/res';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

/** 표시 범위 0:00~24:00 (slot 0=00:00, 30분 단위). */
const SLOT_START = 0;
const SLOT_END = 48;
/** 자동 배치 마법사의 "선호 시작 시각" 기본값 — 오전 9시(slot 18). 종료는 SLOT_END(24:00) 그대로. */
const DEFAULT_START_TIME_PREFERENCE = 18;
/** 새 블록 배치 시 기본 길이 — 곡 실제 재생시간과 무관하게 1시간(2슬롯)으로 고정, 이후 드래그로 조정. */
const DEFAULT_BLOCK_SPAN_SLOTS = 2;
/** 리사이즈 드래그 시 블록 최소 길이 — 30분(1슬롯). */
const MIN_BLOCK_SPAN_SLOTS = 1;
/** 자동 배치 잼 1곡당 길이(슬롯) — 마법사에 이 값을 물어보는 화면이 없어 항상 고정값으로 보낸다.
 * 백엔드 ScheduleAutoPlaceRequest.DEFAULT_JAM_DURATION_SLOTS(4슬롯=2시간)와 동일하게 맞춘다. */
const AUTO_SCHEDULE_JAM_DURATION_SLOTS = 4;

const TRACK_DRAG_TYPE = 'application/x-track-id';
const BLOCK_DRAG_TYPE = 'application/x-block-id';

const KOREAN_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

function mondayOf(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function spanOf(block: { startSlot: number; endSlot: number }): number {
  return block.endSlot - block.startSlot;
}

/** 같은 날짜 안에서 시간대가 겹치는 블록들을 군집으로 묶는다(트랜지티브 겹침 포함) — 블록마다
 * 자신이 속한 군집 전체(자기 자신 포함, 시작 시각순)를 찾을 수 있게 blockId로 매핑한다.
 * 겹치는 게 하나도 없으면 자기 자신 하나짜리 배열이 나온다. 탭했을 때 겹친 블록이 여러 개면
 * 그중 하나를 고르는 선택 팝업을 띄우는 데 쓴다(전부 같은 자리에 쌓여 있어 뒤에 깔린 블록은
 * 직접 탭할 수 없으므로). */
function computeOverlapClusters(
  blocks: ScheduleBlockResponse[],
): Map<string, ScheduleBlockResponse[]> {
  const clusters = new Map<string, ScheduleBlockResponse[]>();
  const byDate = new Map<string, ScheduleBlockResponse[]>();
  for (const block of blocks) {
    const arr = byDate.get(block.startDate) ?? [];
    arr.push(block);
    byDate.set(block.startDate, arr);
  }

  for (const dayBlocks of byDate.values()) {
    const sorted = [...dayBlocks].sort(
      (a, b) => a.startSlot - b.startSlot || a.endSlot - b.endSlot,
    );
    // 시작순 정렬 상태에서 "지금까지의 군집 최대 endSlot"보다 이전에 시작하면 그 군집에 합류 —
    // 병합 구간(merge intervals) 스윕과 동일한 방식으로 트랜지티브 겹침 군집을 나눈다.
    let clusterStart = 0;
    while (clusterStart < sorted.length) {
      let clusterEnd = sorted[clusterStart]!.endSlot;
      let i = clusterStart + 1;
      while (i < sorted.length && sorted[i]!.startSlot < clusterEnd) {
        clusterEnd = Math.max(clusterEnd, sorted[i]!.endSlot);
        i++;
      }
      const cluster = sorted.slice(clusterStart, i);
      for (const block of cluster) clusters.set(block.blockId, cluster);
      clusterStart = i;
    }
  }
  return clusters;
}

/** 보드의 적용 시작일~종료일(windowFrom/To) 안에 드는 날짜인지 — 미설정 보드는 항상 허용.
 * 그리드 헤더/셀 비활성 표시와, 기존 블록 위로 드롭할 때의 기간 밖 가드 둘 다에 쓰인다. */
function isDateInWindow(
  board: Pick<ScheduleBoardResponse, 'windowFrom' | 'windowTo'>,
  date: string,
): boolean {
  if (!board.windowFrom || !board.windowTo) return true;
  return date >= board.windowFrom && date <= board.windowTo;
}

/** 드롭 지점(slot)에 길이 span짜리 블록을 놓을 때의 시작 슬롯 — 백엔드 요청 검증(startSlot 0~47,
 * endSlot 1~48)을 만족하도록 자정 경계 너머로 넘어가지 않게 고정한다. 그대로 두면 23:30(slot 47)
 * 근처에 드롭했을 때 endSlot이 48을 넘어 자동 배치와 별개로 이 저장 요청 자체가 400으로 실패한다. */
function clampBlockStartSlot(slot: number, span: number): number {
  return Math.max(SLOT_START, Math.min(slot, SLOT_END - span));
}

/** 특정 날짜가 속한 주(월요일 기준)가 이번 주로부터 몇 주 떨어져 있는지. 자동 배치로 생긴 블록이
 * 현재 보고 있는 주 바깥에 놓였을 때 그 주로 화면을 이동시키는 데 사용. */
function weekOffsetForDate(dateISO: string): number {
  const targetMonday = mondayOf(new Date(`${dateISO}T00:00:00`));
  const thisMonday = mondayOf(new Date());
  const diffDays = Math.round((targetMonday.getTime() - thisMonday.getTime()) / 86_400_000);
  return Math.round(diffDays / 7);
}

interface ScheduleSessionMember {
  memberId: number;
  name: string;
  profileImg?: string;
}

function MemberRow({
  member,
  tone,
}: {
  member: ScheduleSessionMember;
  tone: 'available' | 'unavailable';
}) {
  return (
    <div
      className={cn(
        'gap-s-2 flex items-center rounded-lg px-2 py-1.5',
        tone === 'available' && 'bg-success-dim/30 border-success/20 border',
        tone === 'unavailable' && 'bg-danger-dim/20 border-danger/20 border',
      )}
    >
      <Avatar size="sm" src={member.profileImg} fallback={member.name} />
      <span className="text-caption min-w-0 flex-1 truncate font-semibold">{member.name}</span>
    </div>
  );
}

/** 30분 단위 슬롯 값을 'HH:MM' 표기로 보여주는 커스텀 스텝퍼 — 네이티브 time input은
 * 브라우저/OS 로케일에 따라 12시간·오전/오후 표기로 렌더돼 형식을 직접 통제할 수 없어 대체.
 * 화살표로만 30분씩 올리고 내리는 게 불편해서, 시(hour)는 키보드로 직접 입력하고 분은
 * 슬롯 규약(30분 단위)에 맞게 00/30 중에서만 고르도록 병행 제공한다. */
function SlotTimeStepper({
  label,
  slot,
  min,
  max,
  onChange,
}: {
  label: string;
  slot: number;
  min: number;
  max: number;
  onChange: (slot: number) => void;
}) {
  const hour = Math.floor(slot / 2);
  const isHalf = slot % 2 === 1;

  function commit(nextHour: number, nextIsHalf: boolean) {
    if (Number.isNaN(nextHour)) return;
    const clampedHour = Math.max(0, Math.min(24, Math.trunc(nextHour)));
    const computed = clampedHour * 2 + (nextIsHalf ? 1 : 0);
    onChange(Math.max(min, Math.min(max, computed)));
  }

  return (
    <Field label={label}>
      {({ inputId }) => (
        <div
          id={inputId}
          className="border-border hover:border-border-hi bg-surface flex h-10 w-full items-center gap-1.5 rounded-[5px] border px-2"
        >
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={24}
            value={hour}
            onChange={(e) => commit(e.target.valueAsNumber, isHalf)}
            aria-label={`${label} 시`}
            className="text-foreground w-8 [appearance:textfield] bg-transparent text-center font-mono text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-foreground-muted text-sm">:</span>
          <div className="gap-s-1 flex">
            {(['00', '30'] as const).map((m) => {
              const selected = (m === '30') === isHalf;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => commit(hour, m === '30')}
                  aria-pressed={selected}
                  aria-label={`${label} ${m}분`}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-semibold transition-colors',
                    selected
                      ? 'bg-white text-neutral-900'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex flex-col">
            <button
              type="button"
              aria-label={`${label} 30분 증가`}
              onClick={() => onChange(Math.min(max, slot + 1))}
              className="text-foreground-muted hover:text-foreground"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label={`${label} 30분 감소`}
              onClick={() => onChange(Math.max(min, slot - 1))}
              className="text-foreground-muted hover:text-foreground"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </Field>
  );
}

const AUTO_SCHEDULE_INTERVAL_LABEL: Record<ScheduleAutoScheduleInterval, string> = {
  ONCE: '한 번만',
  DAILY: '매일',
  WEEKLY: '매주',
  BIWEEKLY: '격주',
  MONTHLY: '매월',
};
const DOW_ORDER: ScheduleAutoScheduleDayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
const DOW_SHORT_LABEL: Record<ScheduleAutoScheduleDayOfWeek, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
};
type OnceOrRecurrence = 'ONCE' | 'RECURRENCE';
/** "하루만"/"하루 이상" — 기획 플로우차트의 "More than a Day?" 를 board.windowFrom/To 로
 * 자동 판정하지 않고, 마법사 첫 화면에서 사용자가 직접 고르게 한다(윈도우 미설정 보드가 많아
 * 자동 판정만으로는 이 분기 자체에 도달하기 어려웠음). */
type DayScope = 'SAME_DAY' | 'MULTI_DAY';

type AutoScheduleWizardStep =
  | 'dayChoice'
  | 'onceOrRecurrence'
  | 'weekChoice'
  | 'twoWeekChoice'
  | 'monthChoice'
  | 'intervalChoice'
  | 'maxJamsPerDay'
  | 'gap'
  | 'dayTimePreference'
  | 'confirmOnly';

/** Recurrence 선택 후 "1주 이상/2주 이상/1달 이상인가요?" 세 질문의 답으로 고를 수 있는 반복 주기
 * 옵션을 결정한다 — board.windowFrom/To 로 자동 판정하지 않고 전부 사용자가 직접 답한다.
 * twoWeeksOrMore가 false면 이 함수까지 안 오고 [DAILY, WEEKLY] 두 개로 고정. */
function recurrenceIntervalOptions(
  twoWeeksOrMore: boolean,
  monthOrMore: boolean,
): ScheduleAutoScheduleInterval[] {
  if (!twoWeeksOrMore) return ['DAILY', 'WEEKLY'];
  if (!monthOrMore) return ['DAILY', 'WEEKLY', 'BIWEEKLY'];
  return ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
}

/** 자동 배치 마법사의 화면 순서 — dayScope/Once-Recurrence 선택과 "1주·2주·1달 이상인가요?" 답에
 * 따라 뒷 단계를 건너뛴다. (기획 플로우차트 그대로: 하루만은 전부 생략, Recurrence + 1주 미만은
 * "매일"로 고정돼 세부 옵션 자체가 필요 없음. 세 질문 전부 사용자가 직접 답하는 명시적 선택.) */
function buildAutoScheduleSteps(
  dayScope: DayScope | null,
  onceOrRecurrence: OnceOrRecurrence | null,
  weekOrMore: boolean | null,
  twoWeeksOrMore: boolean | null,
  monthOrMore: boolean | null,
): AutoScheduleWizardStep[] {
  if (!dayScope || dayScope === 'SAME_DAY') return ['dayChoice'];
  if (!onceOrRecurrence) return ['dayChoice', 'onceOrRecurrence'];
  if (onceOrRecurrence === 'ONCE') {
    return ['dayChoice', 'onceOrRecurrence', 'maxJamsPerDay', 'gap', 'dayTimePreference'];
  }
  // RECURRENCE
  const base: AutoScheduleWizardStep[] = ['dayChoice', 'onceOrRecurrence', 'weekChoice'];
  if (weekOrMore === null) return base;
  if (!weekOrMore) return [...base, 'confirmOnly'];
  base.push('twoWeekChoice');
  if (twoWeeksOrMore === null) return base;
  if (!twoWeeksOrMore) {
    return [...base, 'intervalChoice', 'maxJamsPerDay', 'gap', 'dayTimePreference'];
  }
  base.push('monthChoice');
  if (monthOrMore === null) return base;
  return [...base, 'intervalChoice', 'maxJamsPerDay', 'gap', 'dayTimePreference'];
}

function slotsToDurationLabel(slots: number): string {
  const minutes = slots * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** "합주 사이 허용 공백" 휠 피커의 후보값 — 백엔드 maxEmptySlotsBetweenJams 범위(0~46)와 동일. */
const GAP_SLOT_VALUES = Array.from({ length: 47 }, (_, i) => i);

const WHEEL_ITEM_HEIGHT = 32;

/** 소요 시간(슬롯 단위) 값을 세로 스크롤 휠로 고르는 피커 — "합주 사이 허용 공백"처럼 화살표
 * 한 칸씩 누르기엔 후보가 많은(0~46) 값에 사용. iOS 스타일 휠(가운데 하이라이트 밴드 + 스냅
 * 스크롤)이며, 마우스 휠/터치 스크롤과 클릭 둘 다로 선택 가능. */
function SlotWheelPicker({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const unlockTimerRef = useRef<number | undefined>(undefined);
  const idx = Math.max(0, values.indexOf(value));

  useEffect(() => {
    if (ref.current && !lockRef.current) {
      ref.current.scrollTop = idx * WHEEL_ITEM_HEIGHT;
    }
  }, [idx]);

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      lockRef.current = true;
      const i = Math.round(e.currentTarget.scrollTop / WHEEL_ITEM_HEIGHT);
      const next = values[Math.max(0, Math.min(values.length - 1, i))];
      if (next !== undefined && next !== value) onChange(next);
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = window.setTimeout(() => {
        lockRef.current = false;
      }, 150);
    },
    [onChange, value, values],
  );

  return (
    <Field label={label}>
      {() => (
        <div className="bg-surface border-border relative overflow-hidden rounded-md border">
          <div
            className="pointer-events-none absolute right-0 left-0 z-10 border-y border-white/40 bg-white/10"
            style={{ top: WHEEL_ITEM_HEIGHT * 2, height: WHEEL_ITEM_HEIGHT }}
            aria-hidden="true"
          />
          <div
            ref={ref}
            role="listbox"
            tabIndex={0}
            aria-label={label}
            onScroll={handleScroll}
            className="scrollbar-hide focus-visible:outline-none"
            style={{
              height: WHEEL_ITEM_HEIGHT * 5,
              overflowY: 'scroll',
              scrollSnapType: 'y mandatory',
              paddingTop: WHEEL_ITEM_HEIGHT * 2,
              paddingBottom: WHEEL_ITEM_HEIGHT * 2,
              scrollbarWidth: 'none',
            }}
          >
            {values.map((v) => (
              <div
                key={v}
                role="option"
                aria-selected={v === value}
                onClick={() => onChange(v)}
                className={cn(
                  'flex cursor-pointer items-center justify-center text-sm font-semibold transition-colors',
                  v === value ? 'text-foreground' : 'text-foreground-muted',
                )}
                style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: 'center' }}
              >
                {slotsToDurationLabel(v)}
              </div>
            ))}
          </div>
        </div>
      )}
    </Field>
  );
}

function AutoScheduleModal({
  open,
  board,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  board: ScheduleBoardResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: ScheduleAutoScheduleRequest) => void;
  isPending: boolean;
}) {
  const [step, setStep] = useState(0);
  const [dayScope, setDayScope] = useState<DayScope | null>(null);
  const [onceOrRecurrence, setOnceOrRecurrence] = useState<OnceOrRecurrence | null>(null);
  const [weekOrMore, setWeekOrMore] = useState<boolean | null>(null);
  const [twoWeeksOrMore, setTwoWeeksOrMore] = useState<boolean | null>(null);
  const [monthOrMore, setMonthOrMore] = useState<boolean | null>(null);
  const [recurrenceInterval, setRecurrenceInterval] =
    useState<ScheduleAutoScheduleInterval>('DAILY');
  const [maxJamsPerDay, setMaxJamsPerDay] = useState(1);
  const [maxEmptySlotsBetweenJams, setMaxEmptySlotsBetweenJams] = useState(1);
  const [dayPreference, setDayPreference] = useState<ScheduleAutoScheduleDayOfWeek[]>([]);
  const [startTimePreference, setStartTimePreference] = useState(DEFAULT_START_TIME_PREFERENCE);
  const [endTimePreference, setEndTimePreference] = useState(SLOT_END);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDayScope(null);
    setOnceOrRecurrence(null);
    setWeekOrMore(null);
    setTwoWeeksOrMore(null);
    setMonthOrMore(null);
    setRecurrenceInterval('DAILY');
    setMaxJamsPerDay(1);
    setMaxEmptySlotsBetweenJams(1);
    setDayPreference([]);
    setStartTimePreference(DEFAULT_START_TIME_PREFERENCE);
    setEndTimePreference(SLOT_END);
  }, [open, board?.boardId]);

  function toggleDay(day: ScheduleAutoScheduleDayOfWeek) {
    setDayPreference((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleFinalSubmit() {
    // "하루만"은 질문을 하나도 안 거쳤으니 그 무엇도 사용자가 정한 값이 아니다 — 전부 null로 보내
    // 백엔드 기본값에 맡긴다.
    if (dayScope === 'SAME_DAY') {
      onSubmit({
        interval: null,
        jamDurationSlots: null,
        maxJamsPerDay: null,
        maxEmptySlotsBetweenJams: null,
        dayPreference: null,
        startTimePreference: null,
        endTimePreference: null,
      } as unknown as ScheduleAutoScheduleRequest);
      return;
    }
    // "반복 + 1주 미만"도 마찬가지로 interval="DAILY" 말고는 아무것도 사용자가 정한 값이 아니다 —
    // maxJamsPerDay/gap/dayTimePreference 화면 자체를 안 거쳤으니 그 필드들은 null로 보낸다.
    if (onceOrRecurrence === 'RECURRENCE' && weekOrMore === false) {
      onSubmit({
        interval: 'DAILY',
        jamDurationSlots: null,
        maxJamsPerDay: null,
        maxEmptySlotsBetweenJams: null,
        dayPreference: null,
        startTimePreference: null,
        endTimePreference: null,
      } as unknown as ScheduleAutoScheduleRequest);
      return;
    }
    // 그 외 경로(한 번만 / 반복+1주 이상)는 마법사가 실제로 화면을 다 거쳐서 값을 정하므로, 요청
    // 바디의 필드를 전부 채워서 보낸다 — 필드를 생략해도 백엔드가 옵셔널 필드의 기본값을 적용해줄
    // 거라 기대했는데(스펙상 전부 옵셔널), 실제로는 생략한 요청이 검증 실패(INVALID_INPUT_VALUE)로
    // 거부되는 걸 확인해서(BD-287) 안전하게 FE가 직접 값을 채워 넣는 쪽으로 바꿨다.
    const interval: ScheduleAutoScheduleInterval =
      onceOrRecurrence === 'ONCE' ? 'ONCE' : recurrenceInterval;
    onSubmit({
      interval,
      jamDurationSlots: AUTO_SCHEDULE_JAM_DURATION_SLOTS,
      maxJamsPerDay,
      maxEmptySlotsBetweenJams,
      dayPreference,
      startTimePreference,
      endTimePreference,
    });
  }

  const steps = buildAutoScheduleSteps(
    dayScope,
    onceOrRecurrence,
    weekOrMore,
    twoWeeksOrMore,
    monthOrMore,
  );
  const currentStep = steps[step];
  // steps.length 로 판정하면, 아직 선택하지 않아 스텝 배열이 1개짜리(가지치기 전)일 때 "이게
  // 마지막 스텝"으로 잘못 판정돼 "다음" 대신 (비활성화된) "자동 배치 실행"이 떠 버린다 — 실제로
  // 마법사를 끝맺는 조건(하루만 선택 / 질문 없이 바로 실행 / 요일·시간 선호)으로 직접 판정한다.
  const isLastStep =
    currentStep === 'confirmOnly' ||
    currentStep === 'dayTimePreference' ||
    (currentStep === 'dayChoice' && dayScope === 'SAME_DAY');
  const canGoNext =
    (currentStep !== 'dayTimePreference' || dayPreference.length > 0) &&
    (currentStep !== 'onceOrRecurrence' || onceOrRecurrence !== null) &&
    (currentStep !== 'dayChoice' || dayScope !== null) &&
    (currentStep !== 'weekChoice' || weekOrMore !== null) &&
    (currentStep !== 'twoWeekChoice' || twoWeeksOrMore !== null) &&
    (currentStep !== 'monthChoice' || monthOrMore !== null);
  // twoWeeksOrMore/monthOrMore 는 intervalChoice 화면에 도달했을 때만 의미가 있고, 그땐 이미
  // weekOrMore=true 가 확정된 상태다 — false 폴백은 타입만 맞추기 위함(실제로 안 쓰임).
  const intervalOptions = recurrenceIntervalOptions(twoWeeksOrMore ?? true, monthOrMore ?? true);

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>
            자동 배치 ({step + 1}/{steps.length})
          </ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <ResponsiveSheetBody>
          <div className="gap-s-3 flex flex-col">
            {currentStep === 'confirmOnly' && (
              <p className="text-foreground-muted text-caption">
                선택한 기간이 1주 이하라 매일 반복으로 자동 배치를 실행합니다.
              </p>
            )}
            {currentStep === 'dayChoice' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">배치 기간이 하루 이상인가요?</p>
                <div className="gap-s-2 flex flex-wrap">
                  {(
                    [
                      ['MULTI_DAY', '예'],
                      ['SAME_DAY', '아니오'],
                    ] as const
                  ).map(([opt, label]) => {
                    const selected = dayScope === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDayScope(opt)}
                        className={cn(
                          'text-caption rounded-[5px] border px-3 py-1.5 font-semibold transition-colors',
                          selected
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-border text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 'onceOrRecurrence' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">배치 방식을 선택하세요.</p>
                <div className="gap-s-2 flex flex-wrap">
                  {(
                    [
                      ['ONCE', '한 번만'],
                      ['RECURRENCE', '반복'],
                    ] as const
                  ).map(([opt, label]) => {
                    const selected = onceOrRecurrence === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOnceOrRecurrence(opt)}
                        className={cn(
                          'text-caption rounded-[5px] border px-3 py-1.5 font-semibold transition-colors',
                          selected
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-border text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 'weekChoice' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">기간이 1주 이상인가요?</p>
                <div className="gap-s-2 flex flex-wrap">
                  {(
                    [
                      [true, '예'],
                      [false, '아니오'],
                    ] as const
                  ).map(([opt, label]) => {
                    const selected = weekOrMore === opt;
                    return (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => setWeekOrMore(opt)}
                        className={cn(
                          'text-caption rounded-[5px] border px-3 py-1.5 font-semibold transition-colors',
                          selected
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-border text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 'twoWeekChoice' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">기간이 2주 이상인가요?</p>
                <div className="gap-s-2 flex flex-wrap">
                  {(
                    [
                      [true, '예'],
                      [false, '아니오'],
                    ] as const
                  ).map(([opt, label]) => {
                    const selected = twoWeeksOrMore === opt;
                    return (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => setTwoWeeksOrMore(opt)}
                        className={cn(
                          'text-caption rounded-[5px] border px-3 py-1.5 font-semibold transition-colors',
                          selected
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-border text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 'monthChoice' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">기간이 1달 이상인가요?</p>
                <div className="gap-s-2 flex flex-wrap">
                  {(
                    [
                      [true, '예'],
                      [false, '아니오'],
                    ] as const
                  ).map(([opt, label]) => {
                    const selected = monthOrMore === opt;
                    return (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => setMonthOrMore(opt)}
                        className={cn(
                          'text-caption rounded-[5px] border px-3 py-1.5 font-semibold transition-colors',
                          selected
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-border text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 'intervalChoice' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">반복 주기를 선택하세요.</p>
                <div className="gap-s-2 flex flex-wrap">
                  {intervalOptions.map((opt) => {
                    const selected = recurrenceInterval === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRecurrenceInterval(opt)}
                        className={cn(
                          'text-caption rounded-[5px] border px-3 py-1.5 font-semibold transition-colors',
                          selected
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-border text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {AUTO_SCHEDULE_INTERVAL_LABEL[opt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 'maxJamsPerDay' && (
              <Field
                label="하루 최대 합주 수"
                hint="한 참여자가 하루 최대 참여 가능한 합주 수를 선택하세요."
              >
                {({ inputId }) => (
                  <div className="border-border hover:border-border-hi bg-surface flex h-10 w-full items-center rounded-[5px] border px-3">
                    <input
                      id={inputId}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={20}
                      value={maxJamsPerDay}
                      onChange={(e) => {
                        const n = e.target.valueAsNumber;
                        if (Number.isNaN(n)) return;
                        setMaxJamsPerDay(Math.max(1, Math.min(20, Math.trunc(n))));
                      }}
                      className="text-foreground w-10 [appearance:textfield] bg-transparent font-mono text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-foreground-muted ml-1 text-sm">개</span>
                    <div className="ml-auto flex flex-col">
                      <button
                        type="button"
                        aria-label="하루 최대 합주 수 증가"
                        onClick={() => setMaxJamsPerDay((n) => Math.min(20, n + 1))}
                        className="text-foreground-muted hover:text-foreground"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="하루 최대 합주 수 감소"
                        onClick={() => setMaxJamsPerDay((n) => Math.max(1, n - 1))}
                        className="text-foreground-muted hover:text-foreground"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </Field>
            )}
            {currentStep === 'gap' && (
              <SlotWheelPicker
                label="합주 사이 허용 공백"
                values={GAP_SLOT_VALUES}
                value={maxEmptySlotsBetweenJams}
                onChange={setMaxEmptySlotsBetweenJams}
              />
            )}
            {currentStep === 'dayTimePreference' && (
              <div className="gap-s-6 flex flex-col">
                <div className="gap-s-2 flex flex-col">
                  <p className="text-foreground-muted text-caption">
                    배치를 허용할 요일을 선택하세요.
                  </p>
                  <div className="gap-s-2 flex flex-wrap">
                    {DOW_ORDER.map((day) => {
                      const selected = dayPreference.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            'text-caption h-9 w-9 rounded-[5px] border font-semibold transition-colors',
                            selected
                              ? 'border-white bg-white text-neutral-900'
                              : 'border-border text-foreground-muted hover:text-foreground',
                          )}
                        >
                          {DOW_SHORT_LABEL[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SlotTimeStepper
                    label="선호 시작 시각"
                    slot={startTimePreference}
                    min={SLOT_START}
                    max={endTimePreference - 1}
                    onChange={setStartTimePreference}
                  />
                  <SlotTimeStepper
                    label="선호 종료 시각"
                    slot={endTimePreference}
                    min={startTimePreference + 1}
                    max={SLOT_END}
                    onChange={setEndTimePreference}
                  />
                </div>
              </div>
            )}
          </div>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter className="border-t-0">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-[5px]"
              onClick={() => setStep((s) => s - 1)}
            >
              이전
            </Button>
          ) : (
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost" size="sm" className="rounded-[5px]">
                취소
              </Button>
            </ResponsiveSheetClose>
          )}
          {isLastStep ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isPending}
              disabled={isPending || !canGoNext}
              onClick={handleFinalSubmit}
              className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
            >
              자동 배치 실행
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!canGoNext}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
            >
              다음
            </Button>
          )}
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

type BoardModalState = { mode: 'create' } | { mode: 'edit'; board: ScheduleBoardResponse } | null;

function ScheduleBoardFormModal({
  open,
  mode,
  initial,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial: ScheduleBoardResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: ScheduleBoardCreateRequest) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [windowFrom, setWindowFrom] = useState('');
  const [windowTo, setWindowTo] = useState('');
  const [boardSlotStart, setBoardSlotStart] = useState(SLOT_START);
  const [boardSlotEnd, setBoardSlotEnd] = useState(SLOT_END);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setWindowFrom(initial.windowFrom ?? '');
      setWindowTo(initial.windowTo ?? '');
      setBoardSlotStart(initial.boardTimeRangeFrom);
      setBoardSlotEnd(initial.boardTimeRangeTo);
    } else {
      setName('');
      setWindowFrom('');
      setWindowTo('');
      setBoardSlotStart(SLOT_START);
      setBoardSlotEnd(SLOT_END);
    }
  }, [open, mode, initial]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      windowFrom: windowFrom || undefined,
      windowTo: windowTo || undefined,
      boardTimeRangeFrom: boardSlotStart,
      boardTimeRangeTo: boardSlotEnd,
    });
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>
            {mode === 'create' ? '새 시간표' : '시간표 설정'}
          </ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={handleSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="시간표 이름"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 1차 시간표"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="적용 시작일"
                  type="date"
                  value={windowFrom}
                  onChange={(e) => setWindowFrom(e.target.value)}
                />
                <Input
                  label="적용 종료일"
                  type="date"
                  value={windowTo}
                  onChange={(e) => setWindowTo(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SlotTimeStepper
                  label="시간표 시작 시각"
                  slot={boardSlotStart}
                  min={SLOT_START}
                  max={boardSlotEnd - 1}
                  onChange={setBoardSlotStart}
                />
                <SlotTimeStepper
                  label="시간표 종료 시각"
                  slot={boardSlotEnd}
                  min={boardSlotStart + 1}
                  max={SLOT_END}
                  onChange={setBoardSlotEnd}
                />
              </div>
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter className="border-t-0">
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost" size="sm" className="rounded-[5px]">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!name.trim() || isPending}
              className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
            >
              {mode === 'create' ? '만들기' : '저장'}
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function BlockSettingsModal({
  open,
  block,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  block: ScheduleBlockResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { title: string; note: string }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !block) return;
    setTitle(block.title ?? '');
    setNote(block.note ?? '');
  }, [open, block]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ title: title.trim(), note: note.trim() });
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>블록 설정</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={handleSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="블록 이름"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 1부 세트"
                hint="비워두면 트랙 제목이 대신 표시됩니다."
              />
              <Textarea
                label="메모"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="선택"
                rows={3}
              />
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter className="border-t-0">
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost" size="sm" className="rounded-[5px]">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending}
              className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
            >
              저장
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

export function SetlistScheduleBoard({
  setlistId,
  tracks,
  isManager,
}: {
  setlistId: string;
  tracks: SetlistTrackResponse[];
  isManager: boolean;
}) {
  const toast = useToast();
  const { data: boards, isPending } = useScheduleBoards(setlistId);
  const createBoard = useCreateScheduleBoard(setlistId);
  const updateBoard = useUpdateScheduleBoard(setlistId);
  const deleteBoard = useDeleteScheduleBoard(setlistId);
  const upsertBlock = useUpsertScheduleBlock(setlistId);
  const deleteBlock = useDeleteScheduleBlock(setlistId);
  const setPin = useSetScheduleBlockPin(setlistId);
  const autoSchedule = useAutoScheduleBoard(setlistId);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [boardModal, setBoardModal] = useState<BoardModalState>(null);
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);
  const [pendingDeleteBoard, setPendingDeleteBoard] = useState(false);
  const [blockSettingsTarget, setBlockSettingsTarget] = useState<ScheduleBlockResponse | null>(
    null,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ date: string; slot: number } | null>(null);
  // 블록 리사이즈 드래그 중인 미확정 시작/종료 슬롯 — 체크 버튼을 눌러야 upsertBlock API 호출로 확정.
  const [pendingResize, setPendingResize] = useState<{
    blockId: string;
    startSlot: number;
    endSlot: number;
  } | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  // 블록을 드래그로 옮길 때, 블록 상단이 아니라 블록 중간 어딘가를 잡고 시작하는 경우가
  // 많다 — 그 잡은 지점을 그대로 새 시작 슬롯으로 쓰면(보정 없이) 잡은 지점만큼 블록이
  // 아래로 밀려서 놓이는 것처럼 보인다(3시에 놨는데 5시에 가 있는 등). 드래그 시작 시점에
  // "블록 상단에서 몇 슬롯 내려가서 잡았는지"를 기록해뒀다가, 드롭 시 그만큼 빼서 블록
  // 상단이 실제로 놓은 시간 선에 오도록 보정한다.
  const dragGrabOffsetSlotsRef = useRef(0);
  const hasBoards = Boolean(boards && boards.length > 0);
  // 시간표 생성/삭제는 보기/편집 모드와 무관하게 매니저면 항상 가능. 편집 모드는 블록(트랙 배치)
  // 편집 권한만 통제.
  const canEdit = isManager && mode === 'edit';

  // 시간표 목록이 처음 로드되거나, 활성 시간표가 삭제됐을 때 첫 시간표를 자동 선택.
  useEffect(() => {
    if (!boards) return;
    if (activeBoardId && boards.some((b) => b.boardId === activeBoardId)) return;
    setActiveBoardId(boards[0]?.boardId ?? null);
  }, [boards, activeBoardId]);

  const activeBoard = boards?.find((b) => b.boardId === activeBoardId) ?? null;
  const selectedBlock = activeBoard?.blocks.find((b) => b.blockId === selectedBlockId) ?? null;

  // 겹치는 블록들을 탭했을 때 그 시간대를 가로로 펼쳐서 보여주기 위한 군집 매핑 — 전부 같은
  // 자리에 쌓여 있어 뒤에 깔린 블록은 직접 탭할 수 없으므로, 탭하면 군집 전체를 나란히 펼친다.
  const blockClusters = useMemo(
    () => computeOverlapClusters(activeBoard?.blocks ?? []),
    [activeBoard?.blocks],
  );
  // 현재 펼쳐진 군집들의 키(군집의 첫 블록 id) — 여러 군집을 동시에 펼칠 수 있어 Set으로
  // 관리한다. 비어 있으면 전부 접힌(겹쳐 쌓인) 상태.
  const [expandedClusterIds, setExpandedClusterIds] = useState<Set<string>>(() => new Set());

  // Ctrl/Cmd+C로 복사한 블록 내용 — 트랙 구성·길이·제목/메모에 더해 원본의 날짜·시작 슬롯도
  // 같이 들고 있는다. Ctrl/Cmd+V 시점에 다른 자리를 선택해뒀으면 그 자리(겹쳐 놓기 포함)에,
  // 아무것도 선택 안 해뒀으면 원본과 같은 요일·시간에 새 블록을 만든다.
  const [blockClipboard, setBlockClipboard] = useState<{
    trackIds: string[];
    title?: string;
    note?: string;
    span: number;
    originDate: string;
    originSlot: number;
  } | null>(null);

  const days = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return enumerateDays(toLocalISODate(monday), toLocalISODate(sunday));
  }, [weekOffset]);

  useEffect(() => {
    if (!canEdit || !activeBoard) return;
    const board = activeBoard;

    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || isEditableTarget(e.target)) return;
      const key = e.key.toLowerCase();

      if (key === 'c') {
        if (!selectedBlock) return;
        e.preventDefault();
        setBlockClipboard({
          trackIds: selectedBlock.trackIds,
          title: selectedBlock.title ?? undefined,
          note: selectedBlock.note ?? undefined,
          span: spanOf(selectedBlock),
          originDate: selectedBlock.startDate,
          originSlot: selectedBlock.startSlot,
        });
        // 복사한 원본 블록 선택을 그대로 두면, 그 뒤로 다른 주로 이동해서 붙여넣기를 눌러도
        // "선택된 블록이 있으니 그 자리에" 우선순위에 걸려 계속 원본 자리로만 붙여넣기가
        // 됐다(사실상 선택 해제 전까지 원본을 벗어날 수 없었음) — 복사 직후엔 선택을 풀어서,
        // 명시적으로 다른 자리를 새로 클릭하지 않는 한 "지금 보고 있는 주의 같은 요일"
        // 기본값이 적용되게 한다.
        setSelectedBlockId(null);
        setSelectedCell(null);
        toast.success('블록을 복사했습니다.');
        return;
      }

      if (key === 'v') {
        if (!blockClipboard) return;
        // 붙여넣을 자리 — 블록이 선택돼 있으면 그 블록의 시작 지점(겹쳐 놓기), 선택된 게 없으면
        // 클릭해 둔 빈 셀, 그마저 없으면 원본과 같은 요일·시간. 지금 보고 있는 주의 그 요일로
        // 계산하되, 그게 원본과 정확히 같은 날짜(=원본과 같은 주를 보고 있는 경우)면 다음 주
        // 같은 요일로 한 번 더 밀어서 원본 위에 그대로 겹쳐 생성되는 걸 막는다.
        let sameWeekdayFallback =
          days.find((d) => dayOfWeek(d) === dayOfWeek(blockClipboard.originDate)) ??
          blockClipboard.originDate;
        if (sameWeekdayFallback === blockClipboard.originDate) {
          sameWeekdayFallback = addDays(blockClipboard.originDate, 7);
        }
        const pasteTarget = selectedBlock
          ? { date: selectedBlock.startDate, slot: selectedBlock.startSlot }
          : (selectedCell ?? { date: sameWeekdayFallback, slot: blockClipboard.originSlot });
        e.preventDefault();
        const startSlot = clampBlockStartSlot(pasteTarget.slot, blockClipboard.span);
        upsertBlock.mutate(
          {
            boardId: board.boardId,
            blockId: crypto.randomUUID(),
            body: {
              trackIds: blockClipboard.trackIds,
              startDate: pasteTarget.date,
              startSlot,
              endDate: pasteTarget.date,
              endSlot: startSlot + blockClipboard.span,
              pinned: false,
              title: blockClipboard.title,
              note: blockClipboard.note,
            },
          },
          {
            onSuccess: () => toast.success('블록을 붙여넣었습니다.'),
            onError: () => toast.error('블록 붙여넣기에 실패했습니다.'),
          },
        );
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, activeBoard, selectedBlock, selectedCell, blockClipboard, upsertBlock, toast, days]);

  const rangeLabel = (() => {
    if (days.length === 0) return '';
    const first = days[0]!;
    const last = days[days.length - 1]!;
    return `${first} (${KOREAN_DOW[dayOfWeek(first)]}) ~ ${last.slice(5)} (${KOREAN_DOW[dayOfWeek(last)]})`;
  })();

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.setlistTrackId, t])), [tracks]);
  // 트랙 목록 순서 그대로 색을 하나씩 배정 — 트랙이 12개(팔레트 크기) 이하면 색이 겹치는
  // 트랙이 하나도 없고, 넘으면 최대한 고르게 순환하며 겹친다. songTone(해시 기반)은 트랙
  // 몇 개만 있어도 우연히 겹칠 수 있어서 여기선 안 쓴다.
  const trackToneById = useMemo(
    () => assignPaletteTones(tracks.map((t) => t.setlistTrackId)),
    [tracks],
  );

  // 트랙별 배치 횟수 — 서버가 보드별로 집계해주는 값을 그대로 사용(블록 등록/삭제/자동배치 후
  // 각 훅이 이 쿼리를 함께 invalidate 하므로 항상 최신 상태로 재조회된다).
  const placements = useScheduleBoardPlacements(setlistId, activeBoard?.boardId ?? null);
  const placementCountByTrackId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of placements.data ?? []) {
      counts.set(p.trackId, p.placementCount);
    }
    return counts;
  }, [placements.data]);
  // 하나도 안 배치된 트랙이 위로 오도록 정렬(그룹 내 원래 순서는 유지 — stable sort).
  const sortedTracks = useMemo(
    () =>
      [...tracks].sort((a, b) => {
        const aPlaced = (placementCountByTrackId.get(a.setlistTrackId) ?? 0) > 0 ? 1 : 0;
        const bPlaced = (placementCountByTrackId.get(b.setlistTrackId) ?? 0) > 0 ? 1 : 0;
        return aPlaced - bPlaced;
      }),
    [tracks, placementCountByTrackId],
  );

  // 화면에 보이는 주(월~일) 단위로 벌크 조회 — 주 이동 시 from/to 가 바뀌면서 자동 재조회된다.
  const slotAvailabilities = useSlotAvailabilities(
    setlistId,
    days[0] ?? '',
    days[days.length - 1] ?? '',
  );
  const slotAvailabilityByKey = useMemo(() => {
    const map = new Map<string, SlotAvailabilityResponse>();
    for (const s of slotAvailabilities.data ?? []) {
      map.set(`${s.date}-${s.slot}`, s);
    }
    return map;
  }, [slotAvailabilities.data]);

  // 멤버 이름/프로필 표시용 조회 테이블 — 트랙 세션 참여자 정보에서 가져온다. 빈 칸(전체 멤버)
  // 케이스에서 "누가 셋리스트 멤버인지"는 slot-availabilities 응답 자체(available+unavailable
  // ID를 합친 것)가 이미 전체 멤버를 알려주므로, 여기서는 이름 조회 용도로만 쓴다.
  const memberDisplayById = useMemo(() => {
    const map = new Map<number, { name: string; profileImg?: string }>();
    for (const track of tracks) {
      for (const session of track.sessions) {
        for (const p of session.participants) {
          map.set(p.memberId, { name: p.name, profileImg: p.profileImg });
        }
      }
    }
    return map;
  }, [tracks]);

  // 선택된 블록(해당 트랙 참여자만) 또는 빈 칸(셋리스트 전체 멤버)의 가용 현황을 분류.
  const sessionAvailability = useMemo(() => {
    const toDisplayMember = (memberId: number): ScheduleSessionMember => {
      const display = memberDisplayById.get(memberId);
      return {
        memberId,
        name: display?.name ?? `멤버 ${memberId}`,
        profileImg: display?.profileImg,
      };
    };

    if (selectedBlock) {
      const slotData = slotAvailabilityByKey.get(
        `${selectedBlock.startDate}-${selectedBlock.startSlot}`,
      );
      const availableIds = new Set(slotData?.availableMemberIds ?? []);
      const unavailableIds = new Set(slotData?.unavailableMemberIds ?? []);
      const participantIds = new Set<number>();
      for (const trackId of selectedBlock.trackIds) {
        for (const session of trackById.get(trackId)?.sessions ?? []) {
          for (const p of session.participants) participantIds.add(p.memberId);
        }
      }
      // 셋리스트 멤버(slot-availabilities가 알려주는 available+unavailable)와 해당 트랙 세션
      // 참여자의 교집합만 표시 — 둘 중 하나에도 없는 멤버는 제외.
      const available: ScheduleSessionMember[] = [];
      const unavailable: ScheduleSessionMember[] = [];
      for (const memberId of participantIds) {
        if (availableIds.has(memberId)) available.push(toDisplayMember(memberId));
        else if (unavailableIds.has(memberId)) unavailable.push(toDisplayMember(memberId));
      }
      return { available, unavailable };
    }
    if (selectedCell) {
      const slotData = slotAvailabilityByKey.get(`${selectedCell.date}-${selectedCell.slot}`);
      return {
        available: (slotData?.availableMemberIds ?? []).map(toDisplayMember),
        unavailable: (slotData?.unavailableMemberIds ?? []).map(toDisplayMember),
      };
    }
    return null;
  }, [selectedBlock, selectedCell, trackById, slotAvailabilityByKey, memberDisplayById]);

  function handleBoardFormSubmit(body: ScheduleBoardCreateRequest) {
    if (boardModal?.mode === 'edit') {
      updateBoard.mutate(
        { boardId: boardModal.board.boardId, body },
        {
          onSuccess: () => {
            toast.success('시간표 설정을 저장했습니다.');
            setBoardModal(null);
          },
          onError: () => toast.error('시간표 설정 저장에 실패했습니다.'),
        },
      );
      return;
    }
    createBoard.mutate(body, {
      onSuccess: (board) => {
        setActiveBoardId(board.boardId);
        toast.success('시간표를 만들었습니다.');
        setBoardModal(null);
      },
      onError: () => toast.error('시간표 생성에 실패했습니다.'),
    });
  }

  function handleAutoScheduleSubmit(body: ScheduleAutoScheduleRequest) {
    if (!activeBoard) return;
    // 응답의 blocks 는 기존에 수동으로 넣어둔 블록까지 포함한 보드 전체 상태라, 개수만 보면
    // "새로 배치된 게 없음"과 "기존 블록만 있음"을 구분할 수 없다 — 이전 blockId 집합과 비교해
    // 실제로 새로 생긴 블록만 골라낸다.
    const previousBlockIds = new Set(activeBoard.blocks.map((b) => b.blockId));
    autoSchedule.mutate(
      { boardId: activeBoard.boardId, body },
      {
        onSuccess: (updatedBoard) => {
          setAutoScheduleOpen(false);
          const newlyPlacedBlocks = updatedBoard.blocks.filter(
            (b) => !previousBlockIds.has(b.blockId),
          );
          if (newlyPlacedBlocks.length === 0) {
            toast.error('조건에 맞는 배치를 찾지 못했습니다. 요일·시간 범위를 넓혀보세요.');
            return;
          }
          toast.success('자동 배치를 완료했습니다.');
          // 새로 배치된 블록이 지금 보고 있는 주 바깥에 있을 수 있어, 가장 이른 블록의 주로 이동.
          const firstBlock = [...newlyPlacedBlocks].sort((a, b) =>
            a.startDate.localeCompare(b.startDate),
          )[0];
          if (firstBlock) setWeekOffset(weekOffsetForDate(firstBlock.startDate));
        },
        onError: (err) => toast.error(err.message || '자동 배치에 실패했습니다.'),
      },
    );
  }

  function handleBlockSettingsSubmit(values: { title: string; note: string }) {
    if (!activeBoard || !blockSettingsTarget) return;
    const boardId = activeBoard.boardId;
    const base = blockSettingsTarget;

    upsertBlock.mutate(
      {
        boardId,
        blockId: base.blockId,
        body: {
          trackIds: base.trackIds,
          startDate: base.startDate,
          startSlot: base.startSlot,
          endDate: base.endDate,
          endSlot: base.endSlot,
          pinned: base.pinned,
          title: values.title || undefined,
          note: values.note || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('블록 설정을 저장했습니다.');
          setBlockSettingsTarget(null);
        },
        onError: () => toast.error('블록 설정 저장에 실패했습니다.'),
      },
    );
  }

  function handleDropOnCell(date: string, slot: number) {
    return (e: DragEvent) => {
      e.preventDefault();
      if (!activeBoard) return;

      const movingBlockId = e.dataTransfer.getData(BLOCK_DRAG_TYPE);
      if (movingBlockId) {
        const block = activeBoard.blocks.find((b) => b.blockId === movingBlockId);
        if (!block || block.pinned) return;
        const span = spanOf(block);
        // 드롭한 지점(slot)은 "커서가 놓인 자리"지 "블록 상단이 놓일 자리"가 아니다 — 드래그를
        // 블록 중간 어딘가에서 잡았으면 잡은 만큼 빼줘야 블록 상단이 실제로 놓은 시간 선에 온다.
        const startSlot = clampBlockStartSlot(slot - dragGrabOffsetSlotsRef.current, span);
        upsertBlock.mutate({
          boardId: activeBoard.boardId,
          blockId: movingBlockId,
          body: {
            trackIds: block.trackIds,
            startDate: date,
            startSlot,
            endDate: date,
            endSlot: startSlot + span,
            pinned: block.pinned,
            title: block.title,
          },
        });
        return;
      }

      const trackId = e.dataTransfer.getData(TRACK_DRAG_TYPE);
      if (trackId) {
        const track = trackById.get(trackId);
        if (!track) return;
        const span = DEFAULT_BLOCK_SPAN_SLOTS;
        const startSlot = clampBlockStartSlot(slot, span);
        upsertBlock.mutate({
          boardId: activeBoard.boardId,
          blockId: crypto.randomUUID(),
          body: {
            trackIds: [trackId],
            startDate: date,
            startSlot,
            endDate: date,
            endSlot: startSlot + span,
            pinned: false,
          },
        });
      }
    };
  }

  /** 리사이즈 핸들(상/하) 드래그 시작 — 로컬 pendingResize만 갱신, API 호출은 확정 시점에만. */
  function startBlockEdgeDrag(block: ScheduleBlockResponse, edge: 'start' | 'end') {
    return (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = e.clientY;
      const baseStartSlot =
        pendingResize?.blockId === block.blockId ? pendingResize.startSlot : block.startSlot;
      const baseEndSlot =
        pendingResize?.blockId === block.blockId ? pendingResize.endSlot : block.endSlot;
      let dragged = false;
      const onMove = (moveEvent: PointerEvent) => {
        dragged = true;
        const deltaSlots = Math.round((moveEvent.clientY - startY) / SLOT_HEIGHT);
        if (edge === 'end') {
          const nextEndSlot = Math.min(
            SLOT_END,
            Math.max(baseStartSlot + MIN_BLOCK_SPAN_SLOTS, baseEndSlot + deltaSlots),
          );
          setPendingResize({
            blockId: block.blockId,
            startSlot: baseStartSlot,
            endSlot: nextEndSlot,
          });
        } else {
          const nextStartSlot = Math.max(
            SLOT_START,
            Math.min(baseEndSlot - MIN_BLOCK_SPAN_SLOTS, baseStartSlot + deltaSlots),
          );
          setPendingResize({
            blockId: block.blockId,
            startSlot: nextStartSlot,
            endSlot: baseEndSlot,
          });
        }
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (dragged) {
          // 드래그 종료 지점이 커진 블록 영역 안이면 브라우저가 그 자리에 합성 click 이벤트를 쏴서
          // 블록의 선택 토글(onClick)이 다시 발동해 선택이 풀려버린다 — 드래그 직후 click 한 번만 무시.
          window.addEventListener(
            'click',
            (clickEvent) => {
              clickEvent.stopPropagation();
              clickEvent.preventDefault();
            },
            { capture: true, once: true },
          );
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };
  }

  function handleConfirmResize(block: ScheduleBlockResponse) {
    if (!activeBoard) return;
    const newStartSlot =
      pendingResize?.blockId === block.blockId ? pendingResize.startSlot : block.startSlot;
    const newEndSlot =
      pendingResize?.blockId === block.blockId ? pendingResize.endSlot : block.endSlot;
    setSelectedBlockId(null);
    setPendingResize(null);
    if (newStartSlot === block.startSlot && newEndSlot === block.endSlot) return; // 변경 없음.
    upsertBlock.mutate(
      {
        boardId: activeBoard.boardId,
        blockId: block.blockId,
        body: {
          trackIds: block.trackIds,
          startDate: block.startDate,
          startSlot: newStartSlot,
          endDate: block.endDate,
          endSlot: newEndSlot,
          pinned: block.pinned,
          title: block.title,
        },
      },
      {
        onSuccess: () => toast.success('블록 길이를 수정했습니다.'),
        onError: () => toast.error('블록 길이 수정에 실패했습니다.'),
      },
    );
  }

  return (
    <div className="flex h-full min-w-0">
      {/* 시간표 목록 — 전환/생성/설정/삭제. */}
      <div className="border-border bg-surface flex w-64 shrink-0 flex-col overflow-y-auto border-r">
        <div className="text-foreground-muted text-micro border-border flex h-10 items-center justify-between border-b px-3 font-bold tracking-wider uppercase">
          <span>시간표</span>
          {isManager && (
            <button
              type="button"
              onClick={() => setBoardModal({ mode: 'create' })}
              aria-label="새 시간표"
              className="text-foreground-muted hover:text-foreground rounded p-0.5 normal-case transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {boards && boards.length > 0 ? (
          <ul className="gap-s-1 flex flex-col p-2">
            {boards.map((b) => {
              const active = b.boardId === activeBoardId;
              return (
                <li key={b.boardId}>
                  <div
                    className={cn(
                      'gap-s-1 flex items-center rounded-md border px-2 py-1.5',
                      active ? 'border-white/25 bg-white/10' : 'hover:bg-card border-transparent',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveBoardId(b.boardId)}
                      className="text-caption min-w-0 flex-1 truncate text-left font-semibold"
                    >
                      {b.name}
                    </button>
                    {active && canEdit && (
                      <button
                        type="button"
                        onClick={() => setBoardModal({ mode: 'edit', board: b })}
                        aria-label="시간표 설정"
                        className="text-foreground-muted hover:text-foreground shrink-0 rounded p-1 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {active && isManager && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteBoard(true)}
                        aria-label="시간표 삭제"
                        className="text-foreground-muted hover:text-danger shrink-0 rounded p-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-foreground-muted text-caption px-3 py-3">아직 시간표가 없습니다.</p>
        )}
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="border-border grid h-10 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-4">
          <p className="text-foreground text-sm font-semibold">합주 시간표</p>
          {activeBoard && (
            <div className="gap-s-1 flex items-center justify-self-center">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w - 1)}
                aria-label="이전 주"
                className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-foreground-muted text-caption text-center font-mono">
                {rangeLabel}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                aria-label="다음 주"
                className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {isManager && hasBoards && (
            <div className="gap-s-2 flex items-center justify-self-end">
              {activeBoard && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoScheduleOpen(true)}
                  className="text-foreground-muted hover:text-foreground hover:border-foreground border-foreground-muted h-auto rounded-[5px] border px-2 py-1 text-xs"
                >
                  자동 배치
                </Button>
              )}
              <button
                type="button"
                onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
                aria-label={mode === 'edit' ? '보기 모드로 전환' : '편집 모드로 전환'}
                title={mode === 'edit' ? '보기 모드로 전환' : '편집 모드로 전환'}
                className="text-foreground-muted hover:text-foreground gap-s-1 flex items-center rounded px-2 py-1 text-xs font-semibold transition-colors"
              >
                {mode === 'edit' ? (
                  <Pencil className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {mode === 'edit' ? '편집 중' : '보기 모드'}
              </button>
            </div>
          )}
        </div>

        {!isPending && boards && boards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-foreground-muted text-sm">
              {isManager ? '시간표를 만들어 트랙을 배치해 보세요.' : '아직 시간표가 없습니다.'}
            </p>
            {isManager && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setBoardModal({ mode: 'create' })}
              >
                <Plus className="h-4 w-4" /> 새 시간표 만들기
              </Button>
            )}
          </div>
        ) : (
          activeBoard &&
          (() => {
            // 펼쳐진 군집마다 그 군집이 속한 요일 컬럼 자체를 군집 크기(cluster.length)배로
            // 넓혀서, 겹친 블록들을 원래 크기 그대로 나란히 넣을 자리를 만든다 — 뒤 요일들은
            // 겹치지 않고 자연스럽게 오른쪽으로 밀려난다. 여러 군집을 동시에 펼쳐도(요일이
            // 다르면) 각자 컬럼을 넓히고, 같은 요일에 두 군집이 겹쳐 펼쳐지는 드문 경우엔 더
            // 큰 쪽 배수를 쓴다.
            const wideDayFactors: Record<number, number> = {};
            for (const id of expandedClusterIds) {
              const cluster = blockClusters.get(id);
              if (!cluster || cluster.length < 2) continue;
              const dayIndex = days.indexOf(cluster[0]!.startDate);
              if (dayIndex === -1) continue;
              wideDayFactors[dayIndex] = Math.max(wideDayFactors[dayIndex] ?? 1, cluster.length);
            }
            return (
              <div className="min-h-0 flex-1 px-4 py-3">
                <WeeklyScheduleGrid
                  days={days}
                  slotStart={SLOT_START}
                  slotEnd={SLOT_END}
                  // 적용 시작일~종료일(windowFrom/To) 밖의 날짜는 회색으로 비활성 표시하고 블록을
                  // 못 넣게 막는다 — 미설정 보드는 기존처럼 전체 허용.
                  isInWindow={(date) => isDateInWindow(activeBoard, date)}
                  className="h-full"
                  fillWidth
                  dayColMinWidth={72}
                  wideDayFactors={wideDayFactors}
                  onCellDragOver={canEdit ? () => (e) => e.preventDefault() : undefined}
                  onCellDrop={canEdit ? handleDropOnCell : undefined}
                  onCellClick={(date, slot) => {
                    setSelectedBlockId(null);
                    setSelectedCell({ date, slot });
                  }}
                  overlay={activeBoard.blocks.flatMap((block) => {
                    const dIdx = days.indexOf(block.startDate);
                    if (dIdx === -1) return [];
                    const trackTitles = block.trackIds
                      .map((id) => trackById.get(id)?.title)
                      .filter(Boolean)
                      .join(', ');
                    // 배치된 첫 트랙 색을 그대로 쓴다(트랙 목록과 동일 배정) — 트랙이 아예
                    // 없는 빈 블록만 blockId 해시로 대체 색을 낸다.
                    const tone = block.trackIds[0]
                      ? (trackToneById.get(block.trackIds[0]) ?? songTone(block.blockId, 0))
                      : songTone(block.blockId, 0);
                    const isSelected = selectedBlockId === block.blockId;
                    const displayStartSlot =
                      pendingResize?.blockId === block.blockId
                        ? pendingResize.startSlot
                        : block.startSlot;
                    const displayEndSlot =
                      pendingResize?.blockId === block.blockId
                        ? pendingResize.endSlot
                        : block.endSlot;
                    const displaySpan = displayEndSlot - displayStartSlot;
                    // 30분(1슬롯)짜리 블록은 상하 리사이즈 핸들(각 8px)을 다 얹으면 제목/아이콘 줄과
                    // 겹쳐 잘려 보인다 — 이땐 핸들을 얇게 줄이고 손잡이 표시(grip bar)는 생략.
                    const compactBlock = displaySpan <= 1;
                    const cluster = blockClusters.get(block.blockId) ?? [block];
                    const hasOverlap = cluster.length > 1;
                    // "군집의 첫(시작 시각이 가장 이른) 블록 id"를 펼침 키로 고정해서 썼더니,
                    // 리사이즈·드래그로 군집 내 정렬 순서가 바뀌면(누가 0번인지 바뀌면) 펼칠 때
                    // 저장한 id와 접을 때 지우려는 id가 서로 달라져 못 지우고 남는 경우가
                    // 있었다(접었는데도 그 요일 컬럼이 넓은 채로 남아 블록이 뚱뚱하게 보이던
                    // 원인) — 그래서 군집 "전체 멤버 중 하나라도 펼침 목록에 있으면 펼친 것"으로
                    // 판정하고, 펼칠 땐 지금 탭한 블록 자신의 id를, 접을 땐 지금 군집 멤버 전원의
                    // id를 한꺼번에 지운다(정렬 순서와 무관하게 항상 정확히 지워짐).
                    const clusterKey = cluster[0]!.blockId;
                    const laneIndex = cluster.findIndex((b) => b.blockId === block.blockId);
                    const isExpanded =
                      hasOverlap && cluster.some((b) => expandedClusterIds.has(b.blockId));
                    // "접기" 버튼은 군집당 한 번만 필요하므로 첫 블록 차례(laneIndex 0)에서만
                    // 만든다.
                    const isClusterAnchor = isExpanded && laneIndex === 0;
                    const blockEl = (
                      <div
                        key={block.blockId}
                        draggable={canEdit && !block.pinned}
                        onDragStart={
                          canEdit
                            ? (e) => {
                                e.dataTransfer.setData(BLOCK_DRAG_TYPE, block.blockId);
                                e.dataTransfer.effectAllowed = 'move';
                                // 블록의 어디를 잡고 드래그를 시작했는지(상단에서 몇 슬롯
                                // 내려간 지점인지) 기록 — 드롭 시 이만큼 빼서 보정한다.
                                const rect = e.currentTarget.getBoundingClientRect();
                                dragGrabOffsetSlotsRef.current = Math.round(
                                  (e.clientY - rect.top) / SLOT_HEIGHT,
                                );
                              }
                            : undefined
                        }
                        // 블록 자체가 그 아래 그리드 셀 위에 얹힌 별도 엘리먼트라, 여기 onDragOver/onDrop이
                        // 없으면 브라우저가 기본적으로 드롭을 거부해 "이미 블록이 있는 자리엔 못 놓는"
                        // 것처럼 보였다 — 겹쳐 놓기를 허용하려고 셀과 동일한 드롭 처리를 그대로 위임한다.
                        onDragOver={canEdit ? (e) => e.preventDefault() : undefined}
                        onDrop={
                          canEdit && isDateInWindow(activeBoard, block.startDate)
                            ? (e) => {
                                e.preventDefault();
                                // 자기 자신 위로 다시 놓은 경우는 무시(불필요한 API 호출 방지).
                                const movingBlockId = e.dataTransfer.getData(BLOCK_DRAG_TYPE);
                                if (movingBlockId === block.blockId) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetSlots = Math.round(
                                  (e.clientY - rect.top) / SLOT_HEIGHT,
                                );
                                handleDropOnCell(
                                  block.startDate,
                                  displayStartSlot + offsetSlots,
                                )(e);
                              }
                            : undefined
                        }
                        onClick={() => {
                          setPendingResize(null);
                          setSelectedCell(null);
                          // 겹친 블록이 여러 개면(뒤에 깔린 블록은 직접 탭할 수 없으니) 처음
                          // 탭했을 땐 바로 선택하지 않고 그 시간대를 가로로 펼쳐서 원래 크기
                          // 그대로 나란히 보여준다. 이미 펼쳐진 상태에서 탭하면(각자 제자리로
                          // 나뉘어 있으니) 그때는 일반 블록처럼 바로 선택한다.
                          if (hasOverlap && !isExpanded) {
                            // 다른 군집이 이미 펼쳐져 있어도 그대로 두고 이 군집만 추가로
                            // 펼친다 — 여러 군집을 동시에 펼쳐볼 수 있게. 지금 탭한 블록
                            // 자신의 id를 넣는다(군집 정렬 순서가 바뀌어도 안전하게 지우려면
                            // 접을 때 군집 멤버 전원의 id를 지우면 되므로).
                            setExpandedClusterIds((prev) => new Set(prev).add(block.blockId));
                            return;
                          }
                          setSelectedBlockId((prev) =>
                            prev === block.blockId ? null : block.blockId,
                          );
                        }}
                        className={cn(
                          // select-none 없으면 블록 제목/시간 텍스트 위에서 드래그를 시작할 때
                          // 가끔 브라우저가 우리 draggable(블록 이동)이 아니라 네이티브 텍스트
                          // 드래그로 먼저 반응해서, 잡았는데도 블록이 안 움직이는 것처럼 보였다.
                          'relative m-px flex flex-col overflow-hidden rounded-sm px-1.5 text-left select-none',
                          // 30분~1시간짜리 짧은 블록은 위아래 여백을 넉넉히 주면 제목/시간 텍스트가
                          // 리사이즈 핸들과 겹치거나 잘린다 — 블록이 충분히 길 때만 여백을 넓힌다.
                          displaySpan <= 2 ? 'py-1' : 'py-2',
                          tone.softBg,
                          isSelected ? cn('border-2', tone.border) : cn('border', tone.softBorder),
                          canEdit && !block.pinned
                            ? 'cursor-grab active:cursor-grabbing'
                            : 'cursor-pointer',
                        )}
                        style={{
                          gridRow: `${displayStartSlot - SLOT_START + 2} / span ${displaySpan}`,
                          gridColumn: dIdx + 2,
                          // 펼친 상태면 요일 컬럼 자체가 군집 크기만큼 넓어져 있으니(wideDayFactors),
                          // 그 안에서 겹친 순서(laneIndex)만큼 1/N 칸씩 옆으로 밀어 원래 크기
                          // 그대로 나란히 보이게 한다. 접힌 상태(기본)는 그대로 겹쳐 쌓이고, 그중
                          // 선택된 블록만 위로 올려서 리사이즈 핸들·설정/삭제 버튼이 직접
                          // 눌리도록 한다. z-index는 상단 sticky 요일 헤더(z-20)·좌측 시간
                          // 라벨(z-25)보다 항상 낮게 유지해서 스크롤 시 블록이 그 위로 올라와
                          // 겹쳐 보이지 않게 한다.
                          ...(isExpanded
                            ? {
                                position: 'relative' as const,
                                left: `${(laneIndex / cluster.length) * 100}%`,
                                width: `${(1 / cluster.length) * 100}%`,
                              }
                            : null),
                          zIndex: isExpanded ? (isSelected ? 16 : 12) : isSelected ? 20 : 1,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={cn('truncate text-[11px] font-semibold', tone.text)}>
                            {block.title || trackTitles || '(빈 블록)'}
                          </p>
                          {canEdit && (
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => setBlockSettingsTarget(block)}
                                aria-label="블록 설정"
                                className={cn(
                                  'rounded p-0.5',
                                  block.title || block.note
                                    ? 'text-foreground'
                                    : 'text-foreground-muted hover:text-foreground',
                                )}
                              >
                                <Settings className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPin.mutate({
                                    boardId: activeBoard.boardId,
                                    blockId: block.blockId,
                                    pinned: !block.pinned,
                                  })
                                }
                                aria-label={block.pinned ? '고정 해제' : '고정'}
                                className="text-foreground-muted hover:text-foreground rounded p-0.5"
                              >
                                {block.pinned ? (
                                  <Pin className="h-3 w-3" />
                                ) : (
                                  <PinOff className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteBlock.mutate({
                                    boardId: activeBoard.boardId,
                                    blockId: block.blockId,
                                  })
                                }
                                aria-label="블록 삭제"
                                className="text-foreground-muted hover:text-danger rounded p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-foreground-muted truncate text-[10px]">
                          {slotToTime(displayStartSlot)}~{slotToTime(displayEndSlot)}
                        </p>
                        {canEdit && isSelected && (
                          <>
                            <div
                              onPointerDown={startBlockEdgeDrag(block, 'start')}
                              aria-label="블록 시작 시간 조절"
                              className={cn(
                                'absolute inset-x-0 top-0 flex cursor-ns-resize touch-none items-center justify-center',
                                compactBlock ? 'h-1' : 'h-2',
                              )}
                            >
                              {!compactBlock && (
                                <span className="h-0.5 w-6 rounded-full bg-white/70" />
                              )}
                            </div>
                            <div
                              onPointerDown={startBlockEdgeDrag(block, 'end')}
                              aria-label="블록 종료 시간 조절"
                              className={cn(
                                'absolute inset-x-0 bottom-0 flex cursor-ns-resize touch-none items-center justify-center',
                                compactBlock ? 'h-1' : 'h-2',
                              )}
                            >
                              {!compactBlock && (
                                <span className="h-0.5 w-6 rounded-full bg-white/70" />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                    // 펼친 군집을 접는 "접기" 버튼 — 군집당 한 번만 만든다(군집의 가장 늦은
                    // endSlot 아래에 붙여, 어느 블록과도 겹치지 않게 한다). 요일 컬럼 자체가
                    // 이미 wideDayFactors로 넓어져 있으므로 width는 그 컬럼을 꽉 채우는 100%면
                    // 충분하다. 바깥 클릭으로 닫는 전체 화면 백드롭은 일부러 안 둔다 — 뷰포트
                    // 전체를 덮는 fixed 오버레이가 그 아래 세로 스크롤·모드 전환 버튼 클릭까지
                    // 막아버려서, 접기 버튼을 눌러야만 접히게 하고 싶다는 요청과도 맞는다. 이
                    // 군집만 접고 다른 펼친 군집은 그대로 둔다(동시에 여러 개 펼칠 수 있으니).
                    const expandExtras: ReactElement[] = isClusterAnchor
                      ? [
                          <button
                            key={`${clusterKey}-expand-done`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // 지금 군집 멤버 전원의 id를 지운다 — 펼칠 때 누구 id를 넣었든
                              // (정렬 순서가 바뀌어 펼친 시점과 다른 멤버가 0번이 됐어도)
                              // 항상 정확히 다 지워지도록.
                              setExpandedClusterIds((prev) => {
                                const next = new Set(prev);
                                for (const b of cluster) next.delete(b.blockId);
                                return next;
                              });
                            }}
                            style={{
                              gridRow: `${
                                Math.max(
                                  ...cluster.map((b) =>
                                    pendingResize?.blockId === b.blockId
                                      ? pendingResize.endSlot
                                      : b.endSlot,
                                  ),
                                ) -
                                SLOT_START +
                                2
                              } / span 1`,
                              gridColumn: dIdx + 2,
                              zIndex: 17,
                            }}
                            className="bg-foreground text-bg mt-0.5 flex items-center justify-center gap-1 rounded-sm py-1 text-[11px] font-semibold shadow-md"
                          >
                            <ChevronsDownUp className="h-3 w-3" /> 접기
                          </button>,
                        ]
                      : [];
                    if (!canEdit || !isSelected) {
                      return expandExtras.length ? [blockEl, ...expandExtras] : [blockEl];
                    }
                    const confirmButton = (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmResize(block);
                        }}
                        aria-label="블록 길이 확정"
                        className="pointer-events-auto h-5 w-5 translate-x-1/3 translate-y-1/3 rounded-full bg-white text-neutral-900 shadow-md hover:bg-neutral-100"
                      >
                        <Check className="mx-auto h-3.5 w-3.5" />
                      </button>
                    );
                    // 펼친 상태는 버튼을 자기 칸(lane) 폭·위치만큼 잡은 래퍼로 감싸 그 안에서
                    // 오른쪽 정렬한다 — 버튼 자체에 폭(1/N)을 주면 동그란 모양이 찌그러지므로
                    // 크기는 그대로 두고, 래퍼로만 위치를 옮긴다. 래퍼는 grid item이라 기본
                    // stretch로 셀 전체(=블록의 마지막 행 전체 폭)를 차지하는데, 여기에
                    // pointer-events-none을 안 주면 버튼이 없는 빈 공간까지 클릭을 가로채서
                    // 바로 그 자리에 있는 블록 하단 리사이즈 핸들이 눌리지 않게 된다(상단
                    // 핸들은 이 래퍼와 안 겹쳐서 멀쩡히 됐던 것) — 래퍼는 통과시키고 버튼만
                    // pointer-events-auto로 다시 받게 한다.
                    const confirmEl = isExpanded ? (
                      <div
                        key={`${block.blockId}-confirm`}
                        style={{
                          gridRow: `${displayEndSlot - SLOT_START + 1} / span 1`,
                          gridColumn: dIdx + 2,
                          position: 'relative',
                          left: `${(laneIndex / cluster.length) * 100}%`,
                          width: `${(1 / cluster.length) * 100}%`,
                          zIndex: 17,
                        }}
                        className="pointer-events-none flex items-end justify-end"
                      >
                        {confirmButton}
                      </div>
                    ) : (
                      <div
                        key={`${block.blockId}-confirm`}
                        style={{
                          gridRow: `${displayEndSlot - SLOT_START + 1} / span 1`,
                          gridColumn: dIdx + 2,
                          zIndex: 21,
                        }}
                        className="pointer-events-none flex items-end justify-end"
                      >
                        {confirmButton}
                      </div>
                    );
                    return expandExtras.length
                      ? [blockEl, confirmEl, ...expandExtras]
                      : [blockEl, confirmEl];
                  })}
                />
              </div>
            );
          })()
        )}
      </div>

      <div className="border-border bg-surface flex h-full w-64 shrink-0 flex-col border-l">
        {/* 트랙 목록 — 편집 모드에서만 노출, 그리드로 드래그해서 배치. 자체 스크롤. */}
        {canEdit && (
          <div className="border-border flex max-h-64 shrink-0 flex-col overflow-hidden border-b">
            <div className="text-foreground-muted text-micro border-border flex h-10 shrink-0 items-center border-b px-3 font-bold tracking-wider uppercase">
              트랙 목록
            </div>
            <div className="min-h-0 overflow-y-auto">
              {sortedTracks.length === 0 ? (
                <p className="text-foreground-muted text-micro px-3 py-3">
                  배치할 트랙이 없습니다.
                </p>
              ) : (
                <ul className="gap-s-1 flex flex-col py-2 pr-2 pl-4.5">
                  {sortedTracks.map((track) => {
                    const tone = trackToneById.get(track.setlistTrackId) ?? PALETTE_TONES[0]!;
                    const placedCount = placementCountByTrackId.get(track.setlistTrackId) ?? 0;
                    const placed = placedCount > 0;
                    return (
                      <li key={track.setlistTrackId}>
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(TRACK_DRAG_TYPE, track.setlistTrackId);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className={cn(
                            'text-caption gap-s-1.5 flex cursor-grab items-center rounded-sm border px-2 py-1.5 font-semibold active:cursor-grabbing',
                            tone.softBg,
                            tone.softBorder,
                            tone.text,
                          )}
                          title={track.title}
                        >
                          <span className="min-w-0 flex-1 truncate">{track.title}</span>
                          {placed && (
                            <span className="bg-surface text-foreground-muted border-border shrink-0 rounded-full border px-1.5 text-[10px] leading-4 font-bold">
                              {placedCount}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 세션 멤버 목록 — 블록 클릭 시 해당 트랙 참여자만, 빈 칸 클릭 시 셋리스트 전체 멤버를
            가능/불가능으로 분류. 곡마다 세션 멤버가 달라질 수 있어 그리드 바로 옆에 배치. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="text-foreground-muted text-micro border-border flex h-10 shrink-0 items-center border-b px-3 font-bold tracking-wider uppercase">
            세션 멤버
          </div>
          {sessionAvailability ? (
            <div className="gap-s-4 flex flex-col px-3 py-3">
              <div>
                <p className="text-success gap-s-1 mb-s-2 flex items-center text-sm font-bold">
                  <Check className="h-4 w-4" /> 가능 ({sessionAvailability.available.length}명)
                </p>
                <div className="gap-s-2 flex flex-col">
                  {sessionAvailability.available.map((m) => (
                    <MemberRow key={m.memberId} member={m} tone="available" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-danger gap-s-1 mb-s-2 flex items-center text-sm font-bold">
                  <X className="h-4 w-4" /> 불가 ({sessionAvailability.unavailable.length}명)
                </p>
                <div className="gap-s-2 flex flex-col">
                  {sessionAvailability.unavailable.map((m) => (
                    <MemberRow key={m.memberId} member={m} tone="unavailable" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-foreground-muted text-micro px-3 py-3">
              곡(블록)마다 필요한 세션 멤버가 다를 수 있습니다.
              <br />
              <br />
              블록을 클릭하면 해당 곡 참여자만, 빈 칸을 클릭하면 셋리스트 전체 멤버의 참여 가능
              여부를 확인할 수 있습니다.
            </p>
          )}
        </div>
      </div>

      <ScheduleBoardFormModal
        open={boardModal !== null}
        mode={boardModal?.mode ?? 'create'}
        initial={boardModal?.mode === 'edit' ? boardModal.board : null}
        onOpenChange={(open) => {
          if (!open) setBoardModal(null);
        }}
        onSubmit={handleBoardFormSubmit}
        isPending={createBoard.isPending || updateBoard.isPending}
      />

      <AutoScheduleModal
        open={autoScheduleOpen && activeBoard !== null}
        board={activeBoard}
        onOpenChange={setAutoScheduleOpen}
        onSubmit={handleAutoScheduleSubmit}
        isPending={autoSchedule.isPending}
      />

      <BlockSettingsModal
        open={blockSettingsTarget !== null}
        block={blockSettingsTarget}
        onOpenChange={(open) => {
          if (!open) setBlockSettingsTarget(null);
        }}
        onSubmit={handleBlockSettingsSubmit}
        isPending={upsertBlock.isPending}
      />

      <ConfirmDialog
        open={pendingDeleteBoard}
        onOpenChange={setPendingDeleteBoard}
        title="시간표 삭제"
        description="이 시간표를 정말 삭제하시겠습니까? 배치된 블록도 함께 사라집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!activeBoard) return;
          deleteBoard.mutate(activeBoard.boardId, {
            onError: () => toast.error('시간표 삭제에 실패했습니다.'),
          });
        }}
      />
    </div>
  );
}
