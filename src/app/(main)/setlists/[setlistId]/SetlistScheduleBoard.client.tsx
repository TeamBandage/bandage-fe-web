'use client';

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

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
import { songTone } from '@/domain/schedule-coordination/components/palette';
import {
  SLOT_HEIGHT,
  WeeklyScheduleGrid,
} from '@/domain/schedule-coordination/components/WeeklyScheduleGrid.client';
import {
  dayOfWeek,
  enumerateDays,
  slotToTime,
  toLocalISODate,
} from '@/domain/schedule-coordination/utils';
import { useAutoScheduleBoard } from '@/domain/setlist/hooks/useAutoScheduleBoard';
import { useCreateScheduleBoard } from '@/domain/setlist/hooks/useCreateScheduleBoard';
import { useDeleteScheduleBlock } from '@/domain/setlist/hooks/useDeleteScheduleBlock';
import { useDeleteScheduleBoard } from '@/domain/setlist/hooks/useDeleteScheduleBoard';
import { useScheduleBoards } from '@/domain/setlist/hooks/useScheduleBoards';
import { useSetScheduleBlockPin } from '@/domain/setlist/hooks/useSetScheduleBlockPin';
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
} from '@/domain/setlist/types/res';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

/** 표시 범위 0:00~24:00 (slot 0=00:00, 30분 단위). */
const SLOT_START = 0;
const SLOT_END = 48;
/** 새 블록 배치 시 기본 길이 — 곡 실제 재생시간과 무관하게 1시간(2슬롯)으로 고정, 이후 드래그로 조정. */
const DEFAULT_BLOCK_SPAN_SLOTS = 2;
/** 리사이즈 드래그 시 블록 최소 길이 — 30분(1슬롯). */
const MIN_BLOCK_SPAN_SLOTS = 1;

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

/** 특정 날짜가 속한 주(월요일 기준)가 이번 주로부터 몇 주 떨어져 있는지. 자동 배치로 생긴 블록이
 * 현재 보고 있는 주 바깥에 놓였을 때 그 주로 화면을 이동시키는 데 사용. */
function weekOffsetForDate(dateISO: string): number {
  const targetMonday = mondayOf(new Date(`${dateISO}T00:00:00`));
  const thisMonday = mondayOf(new Date());
  const diffDays = Math.round((targetMonday.getTime() - thisMonday.getTime()) / 86_400_000);
  return Math.round(diffDays / 7);
}

/**
 * 임시 mock — 멤버 가용 시간 API 연동 전까지 memberId+날짜+슬롯 기반 결정적 패턴으로
 * 가능/불가능을 대략 2:1 비율로 나눠 보여준다. 실제 가용 데이터가 아님.
 */
function hashOf(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  return hash;
}

function mockIsAvailable(memberId: number, dateSlotKey: string): boolean {
  return hashOf(`${memberId}-${dateSlotKey}`) % 3 !== 0;
}

interface MockSessionMember {
  memberId: number;
  name: string;
  role: string;
  avatarColor: string;
}

/** 임시 mock 멤버 목록 — 실제 셋리스트 세션 참여자/가용 시간 API 연동 전까지 사용. */
const MOCK_SESSION_MEMBERS: MockSessionMember[] = [
  { memberId: 1, name: '정선우', role: '기타', avatarColor: '#F5A623' },
  { memberId: 2, name: '이정빈', role: '베이스', avatarColor: '#E5484D' },
  { memberId: 3, name: '유승희', role: '보컬', avatarColor: '#3B82F6' },
  { memberId: 4, name: '조수빈', role: '드럼', avatarColor: '#8B5CF6' },
  { memberId: 5, name: '채민주', role: '키보드', avatarColor: '#22D3EE' },
];

function MemberRow({
  member,
  tone,
}: {
  member: MockSessionMember;
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
      <span
        className="text-caption inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.name.slice(0, 1)}
      </span>
      <span className="text-caption min-w-0 flex-1 truncate font-semibold">{member.name}</span>
      <span className="text-foreground-muted text-micro shrink-0">{member.role}</span>
    </div>
  );
}

/** 30분 단위 슬롯 값을 'HH:MM' 표기로 보여주는 커스텀 스텝퍼 — 네이티브 time input은
 * 브라우저/OS 로케일에 따라 12시간·오전/오후 표기로 렌더돼 형식을 직접 통제할 수 없어 대체. */
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
  return (
    <Field label={label}>
      {({ inputId }) => (
        <div
          id={inputId}
          className="border-border hover:border-border-hi bg-surface flex h-10 w-full items-center justify-between rounded-[5px] border px-3"
        >
          <span className="text-foreground font-mono text-sm">{slotToTime(slot)}</span>
          <div className="flex flex-col">
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

const ALL_AUTO_SCHEDULE_INTERVALS: ScheduleAutoScheduleInterval[] = [
  'ONCE',
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
];
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
type AutoScheduleWizardStep =
  | 'interval'
  | 'duration'
  | 'maxJamsPerDay'
  | 'gap'
  | 'dayPreference'
  | 'timePreference';

const AUTO_SCHEDULE_STEPS: AutoScheduleWizardStep[] = [
  'interval',
  'duration',
  'maxJamsPerDay',
  'gap',
  'dayPreference',
  'timePreference',
];

function slotsToDurationLabel(slots: number): string {
  const minutes = slots * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 슬롯 값을 시각(SlotTimeStepper)이 아닌 '소요 시간'으로 보여주는 스텝퍼 — 곡당 합주 시간,
 * 합주 사이 허용 공백처럼 시각이 아니라 길이를 다루는 값에 사용. */
function SlotDurationStepper({
  label,
  slots,
  min,
  max,
  onChange,
}: {
  label: string;
  slots: number;
  min: number;
  max: number;
  onChange: (slots: number) => void;
}) {
  return (
    <Field label={label}>
      {({ inputId }) => (
        <div
          id={inputId}
          className="border-border hover:border-border-hi bg-surface flex h-10 w-full items-center justify-between rounded-[5px] border px-3"
        >
          <span className="text-foreground font-mono text-sm">{slotsToDurationLabel(slots)}</span>
          <div className="flex flex-col">
            <button
              type="button"
              aria-label={`${label} 증가`}
              onClick={() => onChange(Math.min(max, slots + 1))}
              className="text-foreground-muted hover:text-foreground"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label={`${label} 감소`}
              onClick={() => onChange(Math.max(min, slots - 1))}
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
  const [recurrenceInterval, setRecurrenceInterval] =
    useState<ScheduleAutoScheduleInterval>('ONCE');
  const [jamDurationSlots, setJamDurationSlots] = useState(DEFAULT_BLOCK_SPAN_SLOTS);
  const [maxJamsPerDay, setMaxJamsPerDay] = useState(1);
  const [maxEmptySlotsBetweenJams, setMaxEmptySlotsBetweenJams] = useState(1);
  const [dayPreference, setDayPreference] = useState<ScheduleAutoScheduleDayOfWeek[]>([
    ...DOW_ORDER,
  ]);
  const [startTimePreference, setStartTimePreference] = useState(SLOT_START);
  const [endTimePreference, setEndTimePreference] = useState(SLOT_END);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setRecurrenceInterval('ONCE');
    setJamDurationSlots(DEFAULT_BLOCK_SPAN_SLOTS);
    setMaxJamsPerDay(1);
    setMaxEmptySlotsBetweenJams(1);
    setDayPreference([...DOW_ORDER]);
    setStartTimePreference(SLOT_START);
    setEndTimePreference(SLOT_END);
  }, [open, board?.boardId]);

  function toggleDay(day: ScheduleAutoScheduleDayOfWeek) {
    setDayPreference((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleFinalSubmit() {
    onSubmit({
      interval: recurrenceInterval,
      jamDurationSlots,
      maxJamsPerDay,
      maxEmptySlotsBetweenJams,
      dayPreference,
      startTimePreference,
      endTimePreference,
    });
  }

  const steps = AUTO_SCHEDULE_STEPS;
  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const canGoNext = currentStep !== 'dayPreference' || dayPreference.length > 0;

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
            {currentStep === 'interval' && (
              <div className="gap-s-2 flex flex-col">
                <p className="text-foreground-muted text-caption">반복 주기를 선택하세요.</p>
                <div className="gap-s-2 flex flex-wrap">
                  {ALL_AUTO_SCHEDULE_INTERVALS.map((opt) => {
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
            {currentStep === 'duration' && (
              <SlotDurationStepper
                label="곡(합주)당 소요 시간"
                slots={jamDurationSlots}
                min={1}
                max={SLOT_END}
                onChange={setJamDurationSlots}
              />
            )}
            {currentStep === 'maxJamsPerDay' && (
              <Field label="하루 최대 합주 수">
                {({ inputId }) => (
                  <div
                    id={inputId}
                    className="border-border hover:border-border-hi bg-surface flex h-10 w-full items-center justify-between rounded-[5px] border px-3"
                  >
                    <span className="text-foreground font-mono text-sm">{maxJamsPerDay}개</span>
                    <div className="flex flex-col">
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
              <SlotDurationStepper
                label="합주 사이 허용 공백"
                slots={maxEmptySlotsBetweenJams}
                min={0}
                max={46}
                onChange={setMaxEmptySlotsBetweenJams}
              />
            )}
            {currentStep === 'dayPreference' && (
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
            )}
            {currentStep === 'timePreference' && (
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
              disabled={isPending || dayPreference.length === 0}
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
  // 블록 리사이즈 드래그 중인 미확정 시작/종료 슬롯 — 체크 버튼을 눌러야 upsertBlock API 호출로 확정.
  const [pendingResize, setPendingResize] = useState<{
    blockId: string;
    startSlot: number;
    endSlot: number;
  } | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
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

  const days = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return enumerateDays(toLocalISODate(monday), toLocalISODate(sunday));
  }, [weekOffset]);

  const rangeLabel = (() => {
    if (days.length === 0) return '';
    const first = days[0]!;
    const last = days[days.length - 1]!;
    return `${first} (${KOREAN_DOW[dayOfWeek(first)]}) ~ ${last.slice(5)} (${KOREAN_DOW[dayOfWeek(last)]})`;
  })();

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.setlistTrackId, t])), [tracks]);

  // 트랙별 배치 횟수 — 시간표(보드)별로 따로 집계. 반복 배치(같은 곡을 여러 블록에)를 허용하므로
  // 트랙 목록에서 지우지 않고, 배치 여부만 구분해서 표시한다.
  const placementCountByTrackId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of activeBoard?.blocks ?? []) {
      for (const trackId of b.trackIds) {
        counts.set(trackId, (counts.get(trackId) ?? 0) + 1);
      }
    }
    return counts;
  }, [activeBoard]);
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

  // 선택된 블록의 날짜+시간 기준으로 멤버 가능/불가능 분류 (임시 mock — 실제 가용 시간 API 연동 전).
  const blockAvailability = useMemo(() => {
    if (!selectedBlock) return null;
    const dateSlotKey = `${selectedBlock.startDate}-${selectedBlock.startSlot}`;
    const available: MockSessionMember[] = [];
    const unavailable: MockSessionMember[] = [];
    for (const m of MOCK_SESSION_MEMBERS) {
      (mockIsAvailable(m.memberId, dateSlotKey) ? available : unavailable).push(m);
    }
    return { available, unavailable };
  }, [selectedBlock]);

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
        onError: () => toast.error('자동 배치에 실패했습니다.'),
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
        upsertBlock.mutate({
          boardId: activeBoard.boardId,
          blockId: movingBlockId,
          body: {
            trackIds: block.trackIds,
            startDate: date,
            startSlot: slot,
            endDate: date,
            endSlot: slot + span,
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
        upsertBlock.mutate({
          boardId: activeBoard.boardId,
          blockId: crypto.randomUUID(),
          body: {
            trackIds: [trackId],
            startDate: date,
            startSlot: slot,
            endDate: date,
            endSlot: slot + span,
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
          activeBoard && (
            <div className="min-h-0 flex-1 px-4 py-3">
              <WeeklyScheduleGrid
                days={days}
                slotStart={SLOT_START}
                slotEnd={SLOT_END}
                className="h-full"
                fillWidth
                dayColMinWidth={72}
                onCellDragOver={canEdit ? () => (e) => e.preventDefault() : undefined}
                onCellDrop={canEdit ? handleDropOnCell : undefined}
                overlay={activeBoard.blocks.flatMap((block) => {
                  const dIdx = days.indexOf(block.startDate);
                  if (dIdx === -1) return [];
                  const trackTitles = block.trackIds
                    .map((id) => trackById.get(id)?.title)
                    .filter(Boolean)
                    .join(', ');
                  const tone = songTone(block.trackIds[0] ?? block.blockId, 0);
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
                  const blockEl = (
                    <div
                      key={block.blockId}
                      draggable={canEdit && !block.pinned}
                      onDragStart={
                        canEdit
                          ? (e) => {
                              e.dataTransfer.setData(BLOCK_DRAG_TYPE, block.blockId);
                              e.dataTransfer.effectAllowed = 'move';
                            }
                          : undefined
                      }
                      onClick={() => {
                        setPendingResize(null);
                        setSelectedBlockId((prev) =>
                          prev === block.blockId ? null : block.blockId,
                        );
                      }}
                      className={cn(
                        'relative m-px flex flex-col overflow-hidden rounded-sm px-1.5 text-left',
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
                  if (!canEdit || !isSelected) return [blockEl];
                  const confirmEl = (
                    <button
                      key={`${block.blockId}-confirm`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmResize(block);
                      }}
                      aria-label="블록 길이 확정"
                      style={{
                        gridRow: `${displayEndSlot - SLOT_START + 1} / span 1`,
                        gridColumn: dIdx + 2,
                      }}
                      className="z-20 h-5 w-5 translate-x-1/3 translate-y-1/3 self-end justify-self-end rounded-full bg-white text-neutral-900 shadow-md hover:bg-neutral-100"
                    >
                      <Check className="mx-auto h-3.5 w-3.5" />
                    </button>
                  );
                  return [blockEl, confirmEl];
                })}
              />
            </div>
          )
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
                    const tone = songTone(track.setlistTrackId, 0);
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

        {/* 세션 멤버 목록 — 블록 클릭 시 가능/불가능으로 분류(임시 mock, 실제 가용 시간 API 연동 전). 곡마다 세션 멤버가 달라질 수 있어 그리드 바로 옆에 배치. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="text-foreground-muted text-micro border-border flex h-10 shrink-0 items-center border-b px-3 font-bold tracking-wider uppercase">
            세션 멤버
          </div>
          {blockAvailability ? (
            <div className="gap-s-4 flex flex-col px-3 py-3">
              <div>
                <p className="text-success gap-s-1 mb-s-2 flex items-center text-sm font-bold">
                  <Check className="h-4 w-4" /> 가능 ({blockAvailability.available.length}명)
                </p>
                <div className="gap-s-2 flex flex-col">
                  {blockAvailability.available.map((m) => (
                    <MemberRow key={m.memberId} member={m} tone="available" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-danger gap-s-1 mb-s-2 flex items-center text-sm font-bold">
                  <X className="h-4 w-4" /> 불가 ({blockAvailability.unavailable.length}명)
                </p>
                <div className="gap-s-2 flex flex-col">
                  {blockAvailability.unavailable.map((m) => (
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
              블록을 클릭해 해당 곡에 필요한 세션 멤버의 참여 가능 여부를 확인하세요.
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
