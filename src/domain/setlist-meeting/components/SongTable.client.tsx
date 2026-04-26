'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { Member, Song } from '../types';
import { confirmedCount, displaySessionShort, isReady, totalNeed } from '../utils';

export type SongSortKey = 'progress' | 'duration';
export type SongSortDir = 'asc' | 'desc';

import { SessionTrack } from './SessionTrack';

export interface SongTableProps {
  songs: Song[];
  members: Member[];
  selectedSongId: string | null;
  currentUserId: string;
  /** true 이면 모든 곡에 삭제/수정 버튼 노출(매니저). false 이면 본인이 제안한 곡만. */
  isManager?: boolean;
  /** 회의가 매니저에 의해 선곡 확정됨 — 모든 멤버의 수정/삭제 비활성. */
  isLocked?: boolean;
  /** 멤버 검색 매칭 결과 — 해당 userId 가 속한 세션에 빨간 점 표시. */
  matchedUserIds?: ReadonlySet<string>;
  /** 정렬 상태(부모에서 관리). null 이면 원본 순서. */
  sortKey?: SongSortKey | null;
  sortDir?: SongSortDir;
  onToggleSort?: (key: SongSortKey) => void;
  onSelectSong: (songId: string) => void;
  onEditSong?: (songId: string) => void;
  onDeleteSong?: (songId: string) => void;
}

function memberName(members: Member[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? '?';
}

function SortIcon({ active, dir }: { active: boolean; dir: SongSortDir }) {
  if (!active) return <ArrowUpDown className="text-foreground-muted ml-s-1 inline h-3 w-3" />;
  return dir === 'asc' ? (
    <ArrowUp className="text-accent ml-s-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="text-accent ml-s-1 inline h-3 w-3" />
  );
}

export function SongTable({
  songs,
  members,
  selectedSongId,
  currentUserId,
  isManager = false,
  isLocked = false,
  matchedUserIds,
  sortKey = null,
  sortDir = 'asc',
  onToggleSort,
  onSelectSong,
  onEditSong,
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
            <th className="px-s-3 py-s-2 w-10 text-center font-semibold tracking-wider">#</th>
            <th className="px-s-3 py-s-2 font-semibold tracking-wider">곡명</th>
            <th className="px-s-3 py-s-2 hidden font-semibold tracking-wider md:table-cell">
              아티스트
            </th>
            <th className="px-s-3 py-s-2 hidden font-semibold tracking-wider lg:table-cell">
              앨범
            </th>
            <th className="px-s-3 py-s-2 pr-s-5 hidden w-24 text-right font-semibold tracking-wider md:table-cell">
              {onToggleSort ? (
                <button
                  type="button"
                  onClick={() => onToggleSort('duration')}
                  className="hover:text-foreground inline-flex items-center font-semibold tracking-wider uppercase"
                  aria-label="재생 시간 정렬"
                >
                  재생 시간
                  <SortIcon active={sortKey === 'duration'} dir={sortDir} />
                </button>
              ) : (
                <>재생 시간</>
              )}
            </th>
            <th className="px-s-3 py-s-2 pl-s-4 min-w-[160px] font-semibold tracking-wider">
              세션
            </th>
            <th className="px-s-3 py-s-2 w-36 text-right font-semibold tracking-wider">
              {onToggleSort ? (
                <button
                  type="button"
                  onClick={() => onToggleSort('progress')}
                  className="hover:text-foreground inline-flex items-center font-semibold tracking-wider uppercase"
                  aria-label="세션 모집 현황 정렬"
                >
                  세션 모집 현황
                  <SortIcon active={sortKey === 'progress'} dir={sortDir} />
                </button>
              ) : (
                <>세션 모집 현황</>
              )}
            </th>
            <th className="px-s-3 py-s-2 hidden font-semibold tracking-wider lg:table-cell">
              추천자 의견
            </th>
            <th className="px-s-3 py-s-2 w-20" aria-label="작업" />
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
                <td className="px-s-3 py-s-2 text-foreground-muted text-micro text-center font-mono tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="px-s-3 py-s-2 max-w-[180px]">
                  <div className="gap-s-2 flex items-center">
                    {ready && (
                      <span
                        className="bg-success/20 text-success inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        aria-label="합주 가능"
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="text-caption truncate font-bold" title={song.title}>
                      {song.title}
                    </span>
                  </div>
                </td>
                <td className="px-s-3 py-s-2 text-foreground-sub text-caption hidden md:table-cell">
                  {song.artist}
                </td>
                <td className="px-s-3 py-s-2 text-foreground-muted text-caption hidden lg:table-cell">
                  {song.album ?? '-'}
                </td>
                <td className="px-s-3 py-s-2 pr-s-5 text-foreground-muted text-micro hidden text-right font-mono tabular-nums md:table-cell">
                  {song.duration ?? '-'}
                </td>
                <td className="px-s-3 py-s-2 pl-s-4">
                  <div className="gap-s-3 flex flex-wrap items-end">
                    {song.sessions.map((s) => {
                      const apps = song.applicants[s.id] ?? [];
                      const conf = song.confirmed[s.id] ?? [];
                      const highlighted =
                        !!matchedUserIds &&
                        matchedUserIds.size > 0 &&
                        (apps.some((u) => matchedUserIds.has(u)) ||
                          conf.some((u) => matchedUserIds.has(u)));
                      return (
                        <SessionTrack
                          key={s.id}
                          session={s}
                          applicants={apps}
                          confirmed={conf}
                          active={false}
                          mine={apps.includes(currentUserId)}
                          highlighted={highlighted}
                          displayShort={displaySessionShort(s, song.sessions)}
                        />
                      );
                    })}
                  </div>
                </td>
                <td className="px-s-3 py-s-2 align-middle">
                  <div className="gap-s-2 flex items-center justify-end">
                    <div
                      className="bg-card border-border h-1.5 w-20 overflow-hidden rounded-full border"
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
                <td className="px-s-3 py-s-2 text-foreground-muted text-caption hidden max-w-[280px] lg:table-cell">
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
                <td className="px-s-3 py-s-2 align-middle">
                  {(() => {
                    // 잠긴 회의는 모든 멤버에 대해 수정/삭제 비활성.
                    if (isLocked) return null;
                    const canMutate = isManager || song.proposerId === currentUserId;
                    if (!canMutate) return null;
                    // 확정된 곡(모든 세션이 정원만큼 확정)은 수정 비활성 — 확정자 데이터 보호.
                    const editLocked = ready;
                    return (
                      <div className="gap-s-1 flex items-center justify-end">
                        {onEditSong && (
                          <button
                            type="button"
                            disabled={editLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSong(song.id);
                            }}
                            aria-label={
                              editLocked
                                ? `${song.title} 수정 불가 (확정 완료)`
                                : `${song.title} 수정`
                            }
                            title={editLocked ? '확정된 곡은 수정할 수 없습니다.' : '곡 수정'}
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                              editLocked
                                ? 'text-foreground-muted/40 cursor-not-allowed'
                                : 'text-foreground-muted hover:bg-accent-dim hover:text-accent',
                            )}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteSong && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSong(song.id);
                            }}
                            aria-label={`${song.title} 삭제`}
                            className="text-foreground-muted hover:bg-danger-dim hover:text-danger inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
