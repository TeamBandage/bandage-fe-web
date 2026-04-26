'use client';

import { Check, Trash2 } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { Member, Song } from '../types';
import { confirmedCount, isReady, totalNeed } from '../utils';

import { SessionTrack } from './SessionTrack';

export interface SongTableProps {
  songs: Song[];
  members: Member[];
  selectedSongId: string | null;
  focusedSessionId: string | null;
  currentUserId: string;
  /** true 이면 모든 곡에 삭제 버튼 노출(매니저). false 이면 본인이 제안한 곡만. */
  isManager?: boolean;
  onSelectSong: (songId: string) => void;
  onFocusSession: (songId: string, sessionId: string) => void;
  onDeleteSong?: (songId: string) => void;
}

function memberName(members: Member[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? '?';
}

export function SongTable({
  songs,
  members,
  selectedSongId,
  focusedSessionId,
  currentUserId,
  isManager = false,
  onSelectSong,
  onFocusSession,
  onDeleteSong,
}: SongTableProps) {
  if (songs.length === 0) {
    return (
      <div className="text-foreground-muted py-s-8 text-caption text-center">
        조건에 맞는 곡이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface text-foreground-muted text-micro sticky top-0 z-10 uppercase">
          <tr className="border-border border-b">
            <th className="px-s-2 py-s-2 w-10 text-center font-semibold tracking-wider">#</th>
            <th className="px-s-2 py-s-2 font-semibold tracking-wider">곡명</th>
            <th className="px-s-2 py-s-2 hidden font-semibold tracking-wider md:table-cell">
              아티스트
            </th>
            <th className="px-s-2 py-s-2 hidden font-semibold tracking-wider lg:table-cell">
              앨범
            </th>
            <th className="px-s-2 py-s-2 font-semibold tracking-wider">세션</th>
            <th className="px-s-2 py-s-2 w-28 text-right font-semibold tracking-wider">진행도</th>
            <th className="px-s-2 py-s-2 hidden font-semibold tracking-wider lg:table-cell">
              추천자 의견
            </th>
            <th className="px-s-2 py-s-2 w-10" aria-label="삭제" />
          </tr>
        </thead>
        <tbody>
          {songs.map((song, idx) => {
            const ready = isReady(song);
            const selected = selectedSongId === song.id;
            const total = totalNeed(song);
            const done = confirmedCount(song);
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            return (
              <tr
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className={cn(
                  'border-border hover:bg-card cursor-pointer border-b transition-colors',
                  ready && 'border-l-success bg-success-dim/30 border-l-[3px]',
                  selected && 'bg-accent-dim border-l-accent border-l-[3px]',
                )}
              >
                <td className="px-s-2 py-s-2 text-foreground-muted text-micro text-center font-mono tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="px-s-2 py-s-2">
                  <div className="gap-s-2 flex items-center">
                    {ready && (
                      <span
                        className="bg-success/20 text-success inline-flex h-4 w-4 items-center justify-center rounded-full"
                        aria-label="합주 가능"
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="text-caption font-bold">{song.title}</span>
                  </div>
                </td>
                <td className="px-s-2 py-s-2 text-foreground-sub text-caption hidden md:table-cell">
                  {song.artist}
                </td>
                <td className="px-s-2 py-s-2 text-foreground-muted text-caption hidden lg:table-cell">
                  {song.album ?? '-'}
                </td>
                <td className="px-s-2 py-s-2">
                  <div className="gap-s-3 flex flex-wrap items-end">
                    {song.sessions.map((s) => (
                      <SessionTrack
                        key={s.id}
                        session={s}
                        applicants={song.applicants[s.id] ?? []}
                        confirmed={song.confirmed[s.id] ?? []}
                        active={selected && focusedSessionId === s.id}
                        mine={(song.applicants[s.id] ?? []).includes(currentUserId)}
                        onClick={() => onFocusSession(song.id, s.id)}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-s-2 py-s-2 align-middle">
                  <div className="gap-s-2 flex items-center justify-end">
                    <div
                      className="bg-card border-border h-1.5 w-12 overflow-hidden rounded-full border"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={cn('h-full', ready ? 'bg-success' : 'bg-accent')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-foreground-muted text-micro shrink-0 tabular-nums">
                      {done}/{total}
                    </span>
                  </div>
                </td>
                <td className="px-s-2 py-s-2 text-foreground-muted text-caption hidden max-w-[280px] lg:table-cell">
                  {song.note ? (
                    <span className="block truncate" title={song.note}>
                      <span className="text-foreground-sub font-semibold">
                        {memberName(members, song.proposerId)} ·{' '}
                      </span>
                      {song.note}
                    </span>
                  ) : (
                    <span className="text-foreground-muted">-</span>
                  )}
                </td>
                <td className="px-s-2 py-s-2 text-right align-middle">
                  {(isManager || song.proposerId === currentUserId) && onDeleteSong && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`'${song.title}' 을 삭제하시겠습니까?`)) {
                          onDeleteSong(song.id);
                        }
                      }}
                      aria-label={`${song.title} 삭제`}
                      className="text-foreground-muted hover:bg-danger-dim hover:text-danger inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
