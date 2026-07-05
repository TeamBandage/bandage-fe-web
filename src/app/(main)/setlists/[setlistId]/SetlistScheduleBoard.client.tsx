'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { songTone } from '@/domain/schedule-coordination/components/palette';
import { WeeklyScheduleGrid } from '@/domain/schedule-coordination/components/WeeklyScheduleGrid.client';
import { enumerateDays, slotToTime, toLocalISODate } from '@/domain/schedule-coordination/utils';
import type { SetlistTrackResponse } from '@/domain/setlist/types/res';
import { cn } from '@/lib/cn';

/** 근무시간 10:00~22:00 (slot 0=00:00, 30분 단위). */
const SLOT_START = 20;
const SLOT_END = 44;
const DEFAULT_DURATION_SLOTS = 4;

interface PlacedTrack {
  track: SetlistTrackResponse;
  date: string;
  startSlot: number;
  durationSlots: number;
}

function mondayOf(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 셋리스트 트랙을 평일 근무시간 안에 순차 배치한 미리보기.
 * 실제 자동배치는 공연 단위 시간표 API(schedule-boards) 연동 후 대체 예정 — 지금은 시각화 목적의 로컬 배치.
 */
function placeTracks(tracks: SetlistTrackResponse[], days: string[]): PlacedTrack[] {
  const placed: PlacedTrack[] = [];
  let dayIdx = 0;
  let cursor = SLOT_START;

  for (const track of tracks) {
    const durationSlots = track.duration
      ? Math.max(2, Math.ceil(track.duration / 60 / 30))
      : DEFAULT_DURATION_SLOTS;

    if (cursor + durationSlots > SLOT_END) {
      dayIdx += 1;
      cursor = SLOT_START;
    }
    if (dayIdx >= days.length) break;

    placed.push({ track, date: days[dayIdx]!, startSlot: cursor, durationSlots });
    cursor += durationSlots;
  }

  return placed;
}

export function SetlistScheduleBoard({ tracks }: { tracks: SetlistTrackResponse[] }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    return enumerateDays(toLocalISODate(monday), toLocalISODate(friday));
  }, [weekOffset]);

  const placedTracks = useMemo(() => placeTracks(tracks, days), [tracks, days]);

  const rangeLabel =
    days.length > 0 ? `${days[0]!.slice(5)} ~ ${days[days.length - 1]!.slice(5)}` : '';

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
        <p className="text-foreground text-sm font-semibold">합주 시간표</p>
        <div className="gap-s-1 flex items-center">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="이전 주"
            className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-foreground-muted text-caption min-w-[84px] text-center font-mono">
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
      </div>

      <div className="min-h-0 flex-1 px-4 py-3">
        <WeeklyScheduleGrid
          days={days}
          slotStart={SLOT_START}
          slotEnd={SLOT_END}
          className="h-full"
          overlay={placedTracks.map(({ track, date, startSlot, durationSlots }) => {
            const dIdx = days.indexOf(date);
            if (dIdx === -1) return null;
            const tone = songTone(track.setlistTrackId, 0);
            return (
              <div
                key={track.setlistTrackId}
                className={cn(
                  'm-px overflow-hidden rounded-sm border px-1.5 py-1 text-left',
                  tone.softBg,
                  tone.softBorder,
                )}
                style={{
                  gridRow: `${startSlot - SLOT_START + 2} / span ${durationSlots}`,
                  gridColumn: dIdx + 2,
                }}
              >
                <p className={cn('truncate text-[11px] font-semibold', tone.text)}>{track.title}</p>
                <p className="text-foreground-muted truncate text-[10px]">
                  {slotToTime(startSlot)}
                </p>
              </div>
            );
          })}
        />
      </div>

      {tracks.length > placedTracks.length && (
        <p className="text-foreground-muted shrink-0 px-4 pb-3 text-xs">
          이번 주 근무시간에 다 배치하지 못한 트랙이 있습니다. 다음 주로 이동해 확인하세요.
        </p>
      )}
    </div>
  );
}
