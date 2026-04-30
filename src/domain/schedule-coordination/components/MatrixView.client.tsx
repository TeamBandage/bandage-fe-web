'use client';

import { Check, GripVertical, Info, Lock, Pin, Unlock, X } from 'lucide-react';
import { useEffect, useMemo, useState, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { useBoardStore } from '../store/boardStore';
import { useScheduleViewStore } from '../store/scheduleViewStore';
import type { MemberSchedule, ScheduleBlock } from '../types';
import { DEFAULT_BOARD_CONSTRAINTS } from '../types';
import { dayOfWeek, isHoliday, slotToTime, startOfWeek } from '../utils';
import { autoRescheduleAfterMove } from '../utils/autoReschedule';
import { buildCoverageHeatmap, coverageRatio } from '../utils/coverageHeatmap';
import { copyWeekBlocks } from '../utils/copyWeekBlocks';

import type { Member } from '@/domain/setlist-meeting/types';

import { songTone } from './palette';
import { RANGE_PRESETS, DEFAULT_RANGE_PRESET } from './rangePresets';
import { ScheduleBlockPanel } from './ScheduleBlockPanel.client';
const DEFAULT_BLOCK_SLOTS = 2; // 1h
const DOW_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DRAG_MIME = 'application/x-bandage-block';

interface CellRef {
  date: string;
  slot: number;
}
interface DragRange {
  date: string;
  startSlot: number;
  endSlot: number;
}

interface SongLite {
  id: string;
  title: string;
  artist?: string | null;
}

interface DragData {
  songId: string;
  durationSlots: number;
}

interface Props {
  meetingId: string;
  /** 매트릭스가 표시·편집할 보드 id — 단일 데이터 원천 (boardStore.boards[boardId].blocks). */
  boardId: string | null;
  /** 합주 기간 내 모든 일자. */
  allDays: string[];
  participants: Member[];
  memberSchedules: MemberSchedule[];
  /** 합주 블록 풀 — 확정 곡. 우측 슬레이브 패널의 드래그 소스. */
  songPool: SongLite[];
  /** songId → 참여 멤버 userId 배열. 곡별 가용시간 모드 셀렉터. */
  songParticipantsMap?: Record<string, string[]>;
  /** 주차 라벨 클릭 시 → 주차별 UI 로 전환 + 해당 주로 jump. */
  onWeekJump?: (weekStart: string) => void;
}

export function MatrixView({
  meetingId,
  boardId,
  allDays,
  participants,
  memberSchedules,
  songPool,
  songParticipantsMap,
  onWeekJump,
}: Props) {
  const [hover, setHover] = useState<CellRef | null>(null);
  const [pinned, setPinned] = useState<CellRef | null>(null);
  const [drag, setDrag] = useState<DragRange | null>(null);
  const [confirmRange, setConfirmRange] = useState<DragRange | null>(null);
  const [poolDrag, setPoolDrag] = useState<DragData | null>(null);
  const [poolDropHover, setPoolDropHover] = useState<CellRef | null>(null);
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const [pendingApplyAll, setPendingApplyAll] = useState(false);
  const toast = useToast();

  /** 표출 시간 프리셋 — 주차별 UI 와 공유. 변경 시 즉시 반영. */
  const rangePreset = useScheduleViewStore(
    (s) => s.rangePresetByMeeting[meetingId] ?? DEFAULT_RANGE_PRESET,
  );
  const SLOT_FROM = RANGE_PRESETS[rangePreset].start;
  const SLOT_TO = RANGE_PRESETS[rangePreset].end;

  /** 곡별 가용시간 모드 — null = 전체 멤버. */
  const focusedSongId = useScheduleViewStore((s) => s.focusedSongIdByMeeting[meetingId] ?? null);
  const toggleFocusedSongId = useScheduleViewStore((s) => s.toggleFocusedSongId);

  /** 주별 반복/복제 모드 상태. (Task 21) */
  const baseWeekStart = useScheduleViewStore(
    (s) => s.selectedWeekStartByMeeting[meetingId] ?? null,
  );
  const setBaseWeek = useScheduleViewStore((s) => s.setSelectedWeekStart);
  const repeatActive = useScheduleViewStore((s) => s.repeatActiveByMeeting[meetingId] ?? false);
  // useSyncExternalStore 무한 루프 방지 — selector 가 매번 새 배열을 만들면 안 됨.
  // repeatTargetsByMeeting 자체(stable reference)를 select 하고 파생값은 useMemo 로 계산.
  const repeatTargetsByMeeting = useScheduleViewStore((s) => s.repeatTargetsByMeeting);
  const repeatTargets = useMemo(
    () => repeatTargetsByMeeting[meetingId] ?? [],
    [repeatTargetsByMeeting, meetingId],
  );
  const enterRepeatMode = useScheduleViewStore((s) => s.enterRepeatMode);
  const exitRepeatMode = useScheduleViewStore((s) => s.exitRepeatMode);
  const toggleRepeatTarget = useScheduleViewStore((s) => s.toggleRepeatTarget);
  const setHoveredCell = useScheduleViewStore((s) => s.setHoveredCell);

  // boardStore 가 단일 데이터 원천 — 매트릭스/주차별 UI 모두 같은 board.blocks 를 본다.
  const boards = useBoardStore((s) => s.boards);
  const board = boardId ? boards[boardId] : null;
  const blocks = useMemo<ScheduleBlock[]>(() => board?.blocks ?? [], [board]);
  const constraints = board?.constraints ?? DEFAULT_BOARD_CONSTRAINTS;
  const paletteSeed = board?.paletteSeed ?? 0;
  const upsertBlock = useBoardStore((s) => s.upsertBlock);
  const removeBlock = useBoardStore((s) => s.removeBlock);
  const replaceBlocks = useBoardStore((s) => s.replaceBlocks);
  const editBlock = editBlockId ? (blocks.find((b) => b.blockId === editBlockId) ?? null) : null;

  const songMap = useMemo(() => {
    const m = new Map<string, SongLite>();
    for (const s of songPool) m.set(s.id, s);
    return m;
  }, [songPool]);

  /**
   * date+slot → 가능한 userId set.
   * focusedSongId 가 있고 그 곡의 참여 멤버를 알 수 있으면 그 부분집합으로 제한.
   */
  const scopeUserIds = useMemo<'ALL' | string[]>(() => {
    if (!focusedSongId) return 'ALL';
    return songParticipantsMap?.[focusedSongId] ?? [];
  }, [focusedSongId, songParticipantsMap]);

  const availability = useMemo(
    () =>
      buildCoverageHeatmap({
        memberSchedules,
        allDays,
        slotFrom: SLOT_FROM,
        slotTo: SLOT_TO,
        scope: scopeUserIds,
      }),
    [allDays, memberSchedules, SLOT_FROM, SLOT_TO, scopeUserIds],
  );

  /** ratio 분모 — 전체 모드면 전체 멤버, 곡 모드면 곡 참여 멤버 수. */
  const denomMembers = focusedSongId
    ? scopeUserIds === 'ALL'
      ? participants.length
      : scopeUserIds.length
    : participants.length;
  const totalMembers = participants.length;
  const ratio = (date: string, slot: number) =>
    coverageRatio(availability, date, slot, denomMembers);

  const isLocked = (date: string, slot: number) =>
    blocks.some(
      (b) => b.date === date && slot >= b.startSlot && slot < b.startSlot + b.durationSlots,
    );

  const lockAt = (date: string, slot: number) =>
    blocks.find(
      (b) => b.date === date && slot >= b.startSlot && slot < b.startSlot + b.durationSlots,
    );

  /** 워킹 범위 안의 가능한 시작 슬롯인지 — 겹침은 reflow 로 처리하므로 통과. */
  const canDrop = (startSlot: number, dur: number) =>
    startSlot >= SLOT_FROM && startSlot + dur <= SLOT_TO;
  /** 겹침 없이 깔끔하게 떨어지는지 — 하이라이트 강조용. */
  const isCleanDrop = (date: string, startSlot: number, dur: number) => {
    if (!canDrop(startSlot, dur)) return false;
    for (let i = 0; i < dur; i++) {
      if (isLocked(date, startSlot + i)) return false;
    }
    return true;
  };

  /**
   * SidePanel(가능/불가 인원) 표시 기준 = 클릭한 셀(pinned).
   * 호버는 시각적 피드백(셀 outline)만 담당 — 패널 내용은 흔들리지 않음.
   */
  const focus: CellRef | null = pinned;

  // 셀 색상 (PRD §3.2). lock 셀도 가용시간 히트맵을 그대로 노출 — 카드는 그 위에 떠 있는 구조.
  const heatmapBg = (date: string, slot: number): string => {
    const r = ratio(date, slot);
    if (r === 0) return 'bg-card';
    if (r < 0.34) return 'bg-success/20';
    if (r < 0.67) return 'bg-success/45';
    if (r < 1) return 'bg-success/75';
    return 'bg-success';
  };
  const cellBg = (date: string, slot: number, dragHit: boolean): string => {
    if (dragHit) return 'bg-accent';
    if (poolDrag && canDrop(slot, poolDrag.durationSlots)) {
      const hovered = poolDropHover && poolDropHover.date === date && poolDropHover.slot === slot;
      const clean = isCleanDrop(date, slot, poolDrag.durationSlots);
      if (hovered) return clean ? 'bg-accent-dim' : 'bg-warn/40';
      return clean ? 'bg-accent-soft' : 'bg-warn/15';
    }
    return heatmapBg(date, slot);
  };

  const onCellMouseDown =
    (date: string, slot: number) => (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (e.button !== 0) return;
      if (isLocked(date, slot)) return;
      setDrag({ date, startSlot: slot, endSlot: slot + 1 });
    };

  const onCellMouseEnter = (date: string, slot: number) => () => {
    setHover({ date, slot });
    if (drag && drag.date === date) {
      const startSlot = Math.min(drag.startSlot, slot);
      const endSlot = Math.max(drag.startSlot + 1, slot + 1);
      setDrag({ date, startSlot, endSlot });
    }
  };

  // 드래그 select — mouseup 시 핀/확정 미리보기.
  useEffect(() => {
    if (!drag) return;
    const onUp = () => {
      const len = drag.endSlot - drag.startSlot;
      if (len === 1) {
        const cur = { date: drag.date, slot: drag.startSlot };
        setPinned((prev) =>
          prev && prev.date === cur.date && prev.slot === cur.slot ? null : cur,
        );
      } else {
        setConfirmRange(drag);
      }
      setDrag(null);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [drag]);

  const commitConfirm = (songId?: string) => {
    if (!confirmRange || !boardId) return;
    if (!songId) {
      toast.error('곡을 먼저 선택하세요.');
      return;
    }
    const dur = confirmRange.endSlot - confirmRange.startSlot;
    upsertBlock(boardId, {
      blockId: `block_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`,
      songId,
      date: confirmRange.date,
      startSlot: confirmRange.startSlot,
      durationSlots: dur,
      pinned: false,
      paletteIndex: blocks.length,
    });
    toast.success(
      `${confirmRange.date} ${slotToTime(confirmRange.startSlot)}~${slotToTime(confirmRange.endSlot)} 합주 일정 확정`,
    );
    setConfirmRange(null);
    setPinned(null);
  };

  // ─── 풀 드래그 → 매트릭스 드롭 ──────────────────────────────
  /** drag preview 가 다른 셀의 형제 텍스트까지 포함하지 않도록 element 만 ghost 로 사용. */
  const setPoolDragImage = (e: DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.9';
    ghost.style.transform = 'none';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
    setTimeout(() => ghost.remove(), 0);
  };

  const onPoolDragStart = (song: SongLite) => (e: DragEvent) => {
    const data: DragData = { songId: song.id, durationSlots: DEFAULT_BLOCK_SLOTS };
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    setPoolDragImage(e);
    setPoolDrag(data);
  };
  const onPoolDragEnd = () => {
    setPoolDrag(null);
    setPoolDropHover(null);
  };
  const onCellDragOver = (date: string, slot: number) => (e: DragEvent) => {
    if (!poolDrag) return;
    if (!canDrop(slot, poolDrag.durationSlots)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setPoolDropHover({ date, slot });
  };
  const onCellDrop = (date: string, slot: number) => (e: DragEvent) => {
    if (!poolDrag || !boardId) return;
    if (!canDrop(slot, poolDrag.durationSlots)) return;
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME);
    const data: DragData | null = raw ? JSON.parse(raw) : poolDrag;
    setPoolDrag(null);
    setPoolDropHover(null);
    if (!data) return;
    const newBlockId = `block_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
    const newBlock: ScheduleBlock = {
      blockId: newBlockId,
      songId: data.songId,
      date,
      startSlot: slot,
      durationSlots: data.durationSlots,
      pinned: false,
      paletteIndex: blocks.length,
    };
    const all = [...blocks, newBlock];
    const reflowed = autoRescheduleAfterMove({
      blocks: all,
      anchorBlockId: newBlockId,
      constraints,
      availableDates: allDays,
    });
    if (!reflowed) {
      toast.error('빈 시간대가 부족해 배치할 수 없습니다.');
      return;
    }
    replaceBlocks(boardId, reflowed);
    toast.success(
      `${songMap.get(data.songId)?.title ?? '곡'} — ${date} ${slotToTime(slot)} 배치 완료`,
    );
  };

  const slots = Array.from({ length: SLOT_TO - SLOT_FROM }, (_, i) => SLOT_FROM + i);

  /**
   * 주차 그루핑 — allDays 의 일자들을 ISO 주(월~일) 기준으로 묶음.
   * weekStartByDate: date → 그 주의 월요일 ISO
   * weekRows: 주별 [weekStart, dates[]] — 정렬 보존, 매트릭스 좌측 라벨/경계선 렌더에 사용.
   * weekIndexMap: weekStart → 1-based 순번 ("W1", "W2"…) — 사용자 친화적 라벨.
   */
  const { weekRows, firstDateByWeek, weekIndexMap } = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of allDays) {
      const ws = startOfWeek(d);
      const list = map.get(ws);
      if (list) list.push(d);
      else map.set(ws, [d]);
    }
    const ordered = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const fd = new Set(ordered.map(([, ds]) => ds[0]!));
    const idx = new Map<string, number>();
    ordered.forEach(([ws], i) => idx.set(ws, i + 1));
    return { weekRows: ordered, firstDateByWeek: fd, weekIndexMap: idx };
  }, [allDays]);

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* 메인: 매트릭스 그리드 */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="text-foreground-muted text-caption px-s-1 gap-s-3 flex items-center justify-between">
          <span>
            현재 모드:{' '}
            <strong className="text-foreground">
              {focusedSongId
                ? `${songMap.get(focusedSongId)?.title ?? '곡'} 참여 멤버`
                : `전체 멤버 (${totalMembers})`}
            </strong>
            {focusedSongId && scopeUserIds !== 'ALL' && (
              <span className="text-foreground-muted ml-1">({scopeUserIds.length}명)</span>
            )}
          </span>
          <Legend />
        </div>

        {/* Task 21 — 주별 반복/복제 액션바. */}
        <div className="bg-card border-border px-s-3 py-s-2 gap-s-2 flex flex-wrap items-center rounded-md border">
          <span className="text-foreground-muted text-micro">기준 주:</span>
          <strong className="text-foreground text-caption font-mono">
            {baseWeekStart
              ? `W${weekIndexMap.get(baseWeekStart) ?? '?'} (${baseWeekStart.slice(5)})`
              : '미선택 — 주차 라벨을 클릭'}
          </strong>
          <div className="gap-s-2 ml-auto flex items-center">
            {!repeatActive ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!baseWeekStart || weekRows.length < 2}
                  onClick={() => setPendingApplyAll(true)}
                >
                  모든 주차에 적용
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!baseWeekStart || weekRows.length < 2}
                  onClick={() => enterRepeatMode(meetingId)}
                >
                  주별 일정 반복
                </Button>
              </>
            ) : (
              <>
                <span className="text-warn text-micro font-bold">
                  대상 주차 {repeatTargets.length}개 선택됨
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={repeatTargets.length === 0 || !baseWeekStart || !boardId}
                  onClick={() => {
                    if (!baseWeekStart || !boardId) return;
                    const result = copyWeekBlocks({
                      blocks,
                      srcWeekStart: baseWeekStart,
                      targetWeekStarts: repeatTargets,
                      constraints,
                      availableDates: allDays,
                      newId: () =>
                        `block_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`,
                    });
                    replaceBlocks(boardId, result);
                    toast.success(`${repeatTargets.length}개 주차에 복제`);
                    exitRepeatMode(meetingId);
                  }}
                >
                  copy & paste
                </Button>
                <Button size="sm" variant="ghost" onClick={() => exitRepeatMode(meetingId)}>
                  취소
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border-border bg-card flex-1 overflow-auto rounded-md border">
          {/*
           * 폭을 픽셀로 정확히 고정 — tableLayout:fixed 만으로는 컨테이너가 넓을 때
           * 비례 확장되어 슬롯 폭이 들쭉날쭉해진다. width 를 합산값으로 박아 균일 보장.
           */}
          <table
            className="border-collapse select-none"
            style={{
              tableLayout: 'fixed',
              width: 60 + 110 + slots.length * 44,
            }}
          >
            <colgroup>
              <col style={{ width: '60px' }} />
              <col style={{ width: '110px' }} />
              {slots.map((s) => (
                <col key={s} style={{ width: '44px' }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  className="bg-surface border-border sticky top-0 left-0 z-30 border-r border-b"
                  colSpan={2}
                />
                {slots.map((s) => (
                  <th
                    key={s}
                    className="bg-surface text-foreground-muted border-border text-micro sticky top-0 z-20 border-b px-0 py-1.5 text-center font-mono"
                  >
                    {s % 2 === 0 ? slotToTime(s).slice(0, 2) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDays.map((d) => {
                const dow = dayOfWeek(d);
                const holiday = isHoliday(d);
                /**
                 * 색상 규칙: 일·공휴일 → red, 토 → accent, 그 외 평일 → 기본 텍스트
                 * (이전엔 holiday 가 isSun 분기를 가로채 평일 공휴일도 좌측 일자 컬럼에서 일요일
                 *  배지 색을 받았다. 명시적 변수로 정리해 평일은 평일 색을 유지.)
                 */
                const dowToneText =
                  dow === 0 || holiday
                    ? 'text-danger'
                    : dow === 6
                      ? 'text-accent'
                      : 'text-foreground';
                const dowToneBadge =
                  dow === 0 || holiday
                    ? 'bg-danger-dim text-danger'
                    : dow === 6
                      ? 'bg-accent-dim text-accent'
                      : 'bg-card text-foreground-muted';
                const ws = startOfWeek(d);
                const isWeekFirst = firstDateByWeek.has(d);
                const weekRow = weekRows.find(([w]) => w === ws);
                const weekSpan = weekRow ? weekRow[1].length : 1;
                const weekIdx = weekIndexMap.get(ws) ?? 0;
                return (
                  <tr key={d} style={{ height: 40 }}>
                    {isWeekFirst && (
                      <td
                        rowSpan={weekSpan}
                        onClick={() => {
                          if (repeatActive) {
                            if (ws !== baseWeekStart) toggleRepeatTarget(meetingId, ws);
                          } else {
                            setBaseWeek(meetingId, ws);
                          }
                        }}
                        onDoubleClick={() => {
                          if (!repeatActive) onWeekJump?.(ws);
                        }}
                        title={
                          repeatActive
                            ? ws === baseWeekStart
                              ? '기준 주'
                              : '클릭하여 복사 대상 토글'
                            : `클릭=기준 주 지정 / 더블클릭=주차별 UI 로 이동`
                        }
                        // sticky 셀은 항상 솔리드 bg-surface 유지. 강조는 inset ring + 고대비 컬러 클래스로.
                        // (bg-accent-dim alpha 0.14 로 깔면 sticky base bg 가 override 되어
                        //  뒤 매트릭스 본문이 비쳐 보임)
                        className={cn(
                          'border-border bg-surface sticky left-0 z-20 cursor-pointer overflow-hidden border-r-2 border-b-2 p-0 text-center align-middle transition-shadow',
                          'hover:[box-shadow:inset_0_0_0_2px_var(--color-accent)]',
                          baseWeekStart === ws &&
                            '[box-shadow:inset_0_0_0_2px_var(--color-accent)]',
                          repeatActive &&
                            repeatTargets.includes(ws) &&
                            '[box-shadow:inset_0_0_0_2px_var(--color-warn)]',
                        )}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5 px-1 leading-none">
                          <div className="text-foreground text-caption font-bold tracking-wide">
                            W{weekIdx}
                          </div>
                          {baseWeekStart === ws && (
                            <div className="text-accent text-micro font-bold">기준</div>
                          )}
                          {repeatActive && repeatTargets.includes(ws) && (
                            <div className="text-warn text-micro font-bold">대상</div>
                          )}
                        </div>
                      </td>
                    )}
                    <td
                      className={cn(
                        'bg-surface border-border sticky left-[60px] z-10 border-r px-2 py-0.5 whitespace-nowrap',
                        isWeekFirst && 'border-t-2',
                      )}
                    >
                      <div className="gap-s-2 flex items-center">
                        <span
                          className={cn(
                            'text-caption font-mono font-semibold tracking-tight tabular-nums',
                            dowToneText,
                          )}
                        >
                          {d.slice(5)}
                        </span>
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center justify-center rounded px-1 py-px text-[10px] leading-none font-bold tracking-wide uppercase',
                            dowToneBadge,
                          )}
                        >
                          {DOW_LABEL[dow]}
                        </span>
                      </div>
                    </td>
                    {slots.map((s) => {
                      const dragHit =
                        drag !== null && drag.date === d && s >= drag.startSlot && s < drag.endSlot;
                      const block = lockAt(d, s);
                      const isBlockStart = block && block.date === d && block.startSlot === s;
                      // block 의 시작 셀이 아니면 colSpan 에 흡수되므로 td 렌더 자체 skip.
                      if (block && !isBlockStart) return null;
                      const isPinned = pinned?.date === d && pinned?.slot === s;
                      const isHover = !pinned && hover?.date === d && hover?.slot === s && !block;
                      const count = availability.get(`${d}__${s}`)?.size ?? 0;
                      const songTitle = block?.songId
                        ? (songMap.get(block.songId)?.title ?? '곡')
                        : null;
                      const dur = block ? block.durationSlots : 1;
                      return (
                        <td
                          key={s}
                          colSpan={dur}
                          onMouseDown={onCellMouseDown(d, s)}
                          onMouseEnter={onCellMouseEnter(d, s)}
                          onDragOver={onCellDragOver(d, s)}
                          onDragLeave={() => setPoolDropHover(null)}
                          onDrop={onCellDrop(d, s)}
                          onClick={() => {
                            if (block) setEditBlockId(block.blockId);
                            else setHoveredCell(meetingId, { date: d, slot: s });
                          }}
                          onContextMenu={(e) => {
                            // 우클릭 → 합주 블럭 즉시 삭제 (block 영역에서만 동작).
                            if (!block || !boardId) return;
                            e.preventDefault();
                            if (block.pinned) {
                              toast.error('잠금된 블록은 삭제할 수 없습니다 — 먼저 잠금 해제');
                              return;
                            }
                            removeBlock(boardId, block.blockId);
                            toast.success('합주 슬롯 삭제');
                          }}
                          title={
                            block
                              ? `${songTitle ?? '확정 슬롯'} ${slotToTime(block.startSlot)}~${slotToTime(block.startSlot + block.durationSlots)}`
                              : `${d} ${slotToTime(s)} — ${count}/${totalMembers}명 가능`
                          }
                          className={cn(
                            'border-border/50 h-10 border-r border-b p-0 transition-colors',
                            isWeekFirst && 'border-t-border border-t-2',
                            cellBg(d, s, dragHit),
                            isPinned && 'outline-accent outline outline-2 -outline-offset-2',
                            isHover && 'outline-foreground/50 outline outline-1 -outline-offset-1',
                            'cursor-pointer',
                          )}
                        >
                          {block && (
                            <LockBlockCard
                              block={block}
                              paletteSeed={paletteSeed}
                              title={block.songTitleOverride ?? songTitle ?? '확정 슬롯'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditBlockId(block.blockId);
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {confirmRange && (
          <ConfirmPreviewCard
            range={confirmRange}
            totalMembers={totalMembers}
            availability={availability}
            songPool={songPool}
            onCancel={() => setConfirmRange(null)}
            onCommit={commitConfirm}
          />
        )}
      </div>

      {/* 우측 사이드바 — 마스터(가능/불가) + 슬레이브(블록 풀) 세로 stack. */}
      <aside className="flex w-60 shrink flex-col gap-3 lg:w-72 xl:w-80">
        <SidePanel
          focus={focus}
          pinned={!!pinned}
          availability={availability}
          participants={participants}
          memberSchedules={memberSchedules}
          songMap={songMap}
          block={focus ? (lockAt(focus.date, focus.slot) ?? null) : null}
          onUnpin={() => setPinned(null)}
          onRemoveBlock={(blockId) => boardId && removeBlock(boardId, blockId)}
        />
        <BlockPoolPanel
          songPool={songPool}
          onDragStart={onPoolDragStart}
          onDragEnd={onPoolDragEnd}
          focusedSongId={focusedSongId}
          onSongClick={(songId) => toggleFocusedSongId(meetingId, songId)}
        />
      </aside>

      {editBlock && boardId && board && (
        <ScheduleBlockPanel
          boardId={boardId}
          block={editBlock}
          songTitle={songMap.get(editBlock.songId)?.title ?? '곡'}
          paletteSeed={paletteSeed}
          onSave={(updated) => {
            // 길이 변경 가능 — autoRescheduleAfterMove 로 정리.
            const all = blocks.map((b) => (b.blockId === updated.blockId ? updated : b));
            const reflowed = autoRescheduleAfterMove({
              blocks: all,
              anchorBlockId: updated.blockId,
              constraints,
              availableDates: allDays,
            });
            if (!reflowed) {
              toast.error('변경 시 자리 부족 — 다른 블록을 먼저 정리하세요.');
              return;
            }
            replaceBlocks(boardId, reflowed);
            toast.success('변경 완료');
          }}
          onClose={() => setEditBlockId(null)}
        />
      )}

      <ConfirmDialog
        open={pendingApplyAll}
        onOpenChange={(o) => !o && setPendingApplyAll(false)}
        title="모든 주차에 적용"
        description="기준 주의 일정을 다른 모든 주차에 동일 위치로 복제합니다. 대상 주차의 기존 일정은 모두 제거되고 기준 주 일정이 그대로 들어갑니다."
        confirmLabel="적용"
        onConfirm={() => {
          if (!baseWeekStart || !boardId) return;
          const targets = weekRows.map(([ws]) => ws).filter((ws) => ws !== baseWeekStart);
          if (targets.length === 0) return;
          const result = copyWeekBlocks({
            blocks,
            srcWeekStart: baseWeekStart,
            targetWeekStarts: targets,
            constraints,
            availableDates: allDays,
            newId: () =>
              `block_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`,
          });
          replaceBlocks(boardId, result);
          toast.success(`${targets.length}개 주차에 동일하게 복제`);
        }}
      />
    </div>
  );
}

/**
 * 매트릭스 lock 시각화 — 셀 단순 채색 대신 '셀 위에 떠 있는 카드' 로 표시.
 * 시작 셀에서 absolute 로 height = duration * 28px 만큼 차지. 곡 색상 / 제목 / 길이 노출.
 */
/**
 * 매트릭스 lock 카드 — colSpan=duration 으로 합쳐진 셀 안을 가득 채워 렌더.
 * 행=일자, 열=슬롯 구조에서 lock 은 가로로 펼쳐지므로 width 가 자연히 colSpan 만큼 커짐.
 */
function LockBlockCard({
  block,
  paletteSeed,
  title,
  onClick,
}: {
  block: ScheduleBlock;
  paletteSeed: number;
  title: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const tone = songTone(block.songId, paletteSeed);
  const dur = block.durationSlots;
  return (
    <div
      onClick={onClick}
      role="button"
      title={`${title} ${slotToTime(block.startSlot)}~${slotToTime(block.startSlot + dur)}`}
      className={cn(
        'mx-0.5 my-1 flex h-[32px] cursor-pointer items-center gap-1 overflow-hidden rounded-md border border-white/30 px-2 text-left text-white shadow-sm transition-shadow hover:shadow-md hover:ring-2 hover:ring-white/60 hover:ring-inset',
        tone.bg,
      )}
    >
      {block.pinned && <Lock className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden="true" />}
      <span className="text-micro min-w-0 truncate leading-none font-bold">{title}</span>
      <span className="text-micro ml-auto shrink-0 opacity-80">{dur * 30}분</span>
    </div>
  );
}

function Legend() {
  const items = [
    { label: '전원', tone: 'bg-success' },
    { label: '67%↑', tone: 'bg-success/75' },
    { label: '34%↑', tone: 'bg-success/45' },
    { label: '소수', tone: 'bg-success/20' },
  ] as const;
  return (
    <ul className="gap-s-3 flex flex-wrap items-center">
      {items.map((it) => (
        <li key={it.label} className="text-micro gap-s-1 inline-flex items-center font-bold">
          <span className={cn('inline-block h-3 w-3 rounded-sm', it.tone)} />
          <span className="text-foreground-muted">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ConfirmPreviewCard({
  range,
  totalMembers,
  availability,
  songPool,
  onCancel,
  onCommit,
}: {
  range: DragRange;
  totalMembers: number;
  availability: Map<string, Set<string>>;
  songPool: SongLite[];
  onCancel: () => void;
  onCommit: (songId?: string) => void;
}) {
  const [songId, setSongId] = useState<string>('');
  const intersection = useMemo(() => {
    const slots = Array.from(
      { length: range.endSlot - range.startSlot },
      (_, i) => range.startSlot + i,
    );
    let common: Set<string> | null = null;
    for (const s of slots) {
      const set = availability.get(`${range.date}__${s}`) ?? new Set();
      if (common === null) common = new Set(set);
      else for (const id of common) if (!set.has(id)) common.delete(id);
    }
    return common ?? new Set();
  }, [range, availability]);

  const ratio = totalMembers === 0 ? 0 : intersection.size / totalMembers;
  const hours = ((range.endSlot - range.startSlot) * 30) / 60;
  const borderTone =
    ratio === 1 ? 'border-l-success' : ratio >= 0.7 ? 'border-l-accent' : 'border-l-warn';

  return (
    <div
      className={cn(
        'bg-card border-border px-s-4 py-s-3 gap-s-3 flex items-center rounded-md border border-l-4',
        borderTone,
      )}
    >
      <Check className="text-success h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-caption font-bold">합주 시간 확정 미리보기</div>
        <div className="text-foreground text-body mt-0.5 font-mono font-bold">
          {range.date} {slotToTime(range.startSlot)} ~ {slotToTime(range.endSlot)}
        </div>
        <div className="text-foreground-muted text-micro mt-0.5">
          {intersection.size}/{totalMembers}명 가능 · {hours}시간
          {intersection.size < totalMembers && (
            <span className="text-warn ml-2 font-bold">
              · {totalMembers - intersection.size}명 시간 안 맞음
            </span>
          )}
        </div>
      </div>
      {songPool.length > 0 && (
        <select
          value={songId}
          onChange={(e) => setSongId(e.target.value)}
          className="bg-surface border-border text-caption focus-visible:ring-accent rounded-md border px-2 py-1.5 focus-visible:ring-2 focus-visible:outline-none"
          aria-label="곡 매핑"
        >
          <option value="">곡 미지정</option>
          {songPool.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        취소
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => onCommit(songId || undefined)}
        className="bg-success hover:bg-success/90 text-white"
      >
        <Lock className="h-4 w-4" /> 확정 & 잠금
      </Button>
    </div>
  );
}

function SidePanel({
  focus,
  pinned,
  availability,
  participants,
  memberSchedules,
  songMap,
  block,
  onUnpin,
  onRemoveBlock,
}: {
  focus: CellRef | null;
  pinned: boolean;
  availability: Map<string, Set<string>>;
  participants: Member[];
  memberSchedules: MemberSchedule[];
  songMap: Map<string, SongLite>;
  block: ScheduleBlock | null;
  onUnpin: () => void;
  onRemoveBlock: (blockId: string) => void;
}) {
  if (!focus) {
    return (
      <div className="bg-card border-border flex flex-1 flex-col items-center justify-center gap-2 rounded-md border p-6 text-center">
        <Info className="text-foreground-muted/60 h-5 w-5" />
        <p className="text-foreground-muted text-caption">
          매트릭스의 셀에 호버하면
          <br />
          해당 시간의 멤버 가용성이 표시됩니다.
        </p>
      </div>
    );
  }

  const dow = dayOfWeek(focus.date);
  const dowLabel = DOW_LABEL[dow];
  const availableIds = availability.get(`${focus.date}__${focus.slot}`) ?? new Set<string>();
  const total = participants.length;

  const unavailable: Array<{ member: Member; reason?: string }> = [];
  const available: Member[] = [];
  for (const m of participants) {
    if (availableIds.has(m.id)) {
      available.push(m);
    } else {
      const sched = memberSchedules.find((s) => s.userId === m.id);
      const reason = !sched
        ? '미입력'
        : !sched.availableDates.includes(focus.date)
          ? '선약'
          : '시간';
      unavailable.push({ member: m, reason });
    }
  }

  const blockedSong = block?.songId ? songMap.get(block.songId) : null;

  return (
    <div className="bg-card border-border flex flex-1 flex-col overflow-hidden rounded-md border">
      <div className="border-border px-s-4 py-s-3 border-b">
        <div className="text-foreground-muted text-micro gap-s-1 flex items-center font-bold uppercase">
          {block ? (
            <>
              <Lock className="h-3 w-3" /> 합주 배치됨
            </>
          ) : pinned ? (
            <>
              <Pin className="h-3 w-3" /> 고정됨
            </>
          ) : (
            <>선택됨</>
          )}
        </div>
        <div className="text-foreground text-body mt-0.5 font-mono font-bold">
          {focus.date} ({dowLabel}) {slotToTime(focus.slot)}
        </div>
        {blockedSong && (
          <div className="text-accent text-caption mt-0.5 font-bold">{blockedSong.title}</div>
        )}
        <div className="mt-s-2 gap-s-2 flex items-center">
          <div
            className="bg-bg/40 h-2 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={available.length}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className={cn(
                'h-full transition-all',
                available.length === total ? 'bg-success' : 'bg-accent',
              )}
              style={{
                width: `${total === 0 ? 0 : Math.round((available.length / total) * 100)}%`,
              }}
            />
          </div>
          <span className="text-caption text-foreground font-bold tabular-nums">
            {available.length}/{total}
          </span>
        </div>
        {pinned && !block && (
          <button
            type="button"
            onClick={onUnpin}
            className="text-foreground-muted hover:text-foreground text-micro mt-s-2 inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> 고정 해제
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {available.length > 0 && (
          <div className="px-s-3 py-s-3">
            <div className="text-success text-caption mb-s-2 gap-s-1 flex items-center font-bold">
              <Check className="h-3.5 w-3.5" /> 가능 ({available.length}명)
            </div>
            <ul className="gap-s-1 flex flex-col">
              {available.map((m) => (
                <li key={m.id}>
                  <MemberChip member={m} variant="ok" />
                </li>
              ))}
            </ul>
          </div>
        )}
        {unavailable.length > 0 && (
          <div className="border-border px-s-3 py-s-3 border-t">
            <div className="text-danger text-caption mb-s-2 gap-s-1 flex items-center font-bold">
              <X className="h-3.5 w-3.5" /> 불가 ({unavailable.length}명)
            </div>
            <ul className="gap-s-1 flex flex-col">
              {unavailable.map(({ member, reason }) => (
                <li key={member.id}>
                  <MemberChip member={member} variant="no" reason={reason} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {block && (
        <div className="border-border px-s-3 py-s-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveBlock(block.blockId)}
            className="text-danger w-full"
          >
            <Unlock className="h-4 w-4" /> 이 합주 슬롯 제거
          </Button>
        </div>
      )}
    </div>
  );
}

function BlockPoolPanel({
  songPool,
  onDragStart,
  onDragEnd,
  focusedSongId,
  onSongClick,
}: {
  songPool: SongLite[];
  onDragStart: (song: SongLite) => (e: DragEvent) => void;
  onDragEnd: () => void;
  focusedSongId: string | null;
  onSongClick: (songId: string) => void;
}) {
  return (
    <div className="bg-card border-border flex max-h-[40%] flex-col overflow-hidden rounded-md border">
      <div className="border-border px-s-3 py-s-2 border-b">
        <div className="text-foreground-muted text-micro font-bold uppercase">
          합주 블록 풀 ({songPool.length})
        </div>
        <div className="text-foreground-muted text-micro mt-0.5">
          드래그=배치 / 클릭=곡 참여 멤버 가용시간 모드
        </div>
      </div>
      <div className="px-s-2 py-s-2 gap-s-1 flex flex-1 flex-col overflow-y-auto">
        {songPool.length === 0 ? (
          <p className="text-foreground-muted text-micro p-2">확정된 곡이 없습니다.</p>
        ) : (
          songPool.map((song) => {
            const tone = songTone(song.id, 0);
            const focused = focusedSongId === song.id;
            return (
              <button
                key={song.id}
                draggable
                onDragStart={onDragStart(song)}
                onDragEnd={onDragEnd}
                onClick={() => onSongClick(song.id)}
                aria-pressed={focused}
                title={focused ? '클릭하여 전체 멤버 모드로' : '클릭하여 이 곡 참여 멤버 모드로'}
                className={cn(
                  'gap-s-2 flex items-center rounded-md px-2 py-1.5 text-left text-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]',
                  tone.bg,
                  focused && 'ring-accent ring-offset-card ring-2 ring-offset-2',
                )}
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <div className="min-w-0">
                  <div className="text-micro truncate font-bold">{song.title}</div>
                  {song.artist && (
                    <div className="text-micro truncate opacity-75">{song.artist}</div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function MemberChip({
  member,
  variant,
  reason,
}: {
  member: Member;
  variant: 'ok' | 'no';
  reason?: string;
}) {
  const initial = member.name.slice(0, 1);
  return (
    <div
      className={cn(
        'gap-s-2 flex items-center rounded-md px-2 py-1.5',
        variant === 'ok' ? 'bg-success-dim' : 'bg-danger-dim grayscale-[0.4]',
      )}
    >
      <span
        className="text-bg inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: member.avatar ?? '#6b6b80' }}
      >
        {initial}
      </span>
      <span className="text-caption flex-1 truncate font-bold">{member.name}</span>
      <span className="text-foreground-muted text-micro">{member.role ?? ''}</span>
      {variant === 'no' && reason && (
        <span className="bg-danger-dim text-danger text-micro px-s-2 rounded-full py-0.5 font-bold">
          {reason}
        </span>
      )}
    </div>
  );
}
