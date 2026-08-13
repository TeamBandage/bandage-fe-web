'use client';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  MessageSquare,
  Pencil,
  Pin,
  Trash2,
} from 'lucide-react';

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
  /** 곡별 의견 채팅 패널 열기. */
  onOpenChat?: (songId: string) => void;
  /** 매니저가 잠금 상태에서 최종 선곡 확정/해제. */
  onToggleSelection?: (songId: string, selected: boolean) => void;
}

function memberName(members: Member[], id: string, currentUserId?: string): string {
  if (currentUserId && id === currentUserId) return '나';
  return members.find((m) => m.id === id)?.name ?? '?';
}

function SortIcon({ active, dir }: { active: boolean; dir: SongSortDir }) {
  if (!active) return <ArrowUpDown className="text-foreground-muted ml-s-1 inline h-3 w-3" />;
  return dir === 'asc' ? (
    <ArrowUp className="ml-s-1 inline h-3 w-3 text-white" />
  ) : (
    <ArrowDown className="ml-s-1 inline h-3 w-3 text-white" />
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
  onOpenChat,
  onToggleSelection,
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
                data-song-id={song.id}
                onClick={() => onSelectSong(song.id)}
                className={cn(
                  'border-border hover:bg-card cursor-pointer border-b transition-colors',
                  ready && 'border-l-success bg-success-dim/30 border-l-[3px]',
                  selected && 'border-l-[3px] border-l-white bg-white/10',
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
                        className={cn('h-full', ready ? 'bg-success' : 'bg-white')}
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
                        {memberName(members, song.proposerId, currentUserId)} ·{' '}
                      </span>
                      {song.note}
                    </span>
                  ) : (
                    <span className="text-foreground-muted">-</span>
                  )}
                </td>
                <td className="px-s-3 py-s-2 align-middle">
                  <div className="gap-s-1 flex items-center justify-end">
                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(song.id);
                        }}
                        aria-label={`${song.title} 의견 채팅${song.chatMessageCount ? ` (${song.chatMessageCount}개)` : ''}`}
                        title="의견 채팅"
                        className="text-foreground-muted relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <MessageSquare className="h-4.5 w-4.5" />
                        {!!song.chatMessageCount && song.chatMessageCount > 0 && (
                          <span className="bg-foreground text-bg absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] leading-none font-bold">
                            {song.chatMessageCount > 99 ? '99+' : song.chatMessageCount}
                          </span>
                        )}
                      </button>
                    )}
                    {(() => {
                      // 잠긴 후: 선택된 곡은 읽기 전용 핀으로 표시, 수정/삭제 불가.
                      // 고정 여부와 무관하게 채팅 아이콘 위치를 통일하기 위해 슬롯 너비(w-7)는 항상 유지.
                      if (isLocked) {
                        return (
                          <span
                            aria-label={song.isSelected ? '셋리스트 선택됨' : undefined}
                            title={song.isSelected ? '셋리스트에 포함된 곡' : undefined}
                            className="text-warn inline-flex h-7 w-7 items-center justify-center"
                          >
                            {song.isSelected && <Pin className="h-4 w-4" fill="currentColor" />}
                          </span>
                        );
                      }

                      const canMutate = isManager || song.proposerId === currentUserId;
                      // 확정된 곡(모든 세션이 정원만큼 확정)은 수정 비활성 — 확정자 데이터 보호.
                      const editLocked = ready;

                      return (
                        <>
                          {/* 매니저에게 최종 선곡 토글 표시 (백엔드는 잠금 후 isSelected 변경 거부). */}
                          {isManager && onToggleSelection && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelection(song.id, !song.isSelected);
                              }}
                              aria-label={
                                song.isSelected ? '셋리스트 선택 해제' : '셋리스트에 추가'
                              }
                              title={song.isSelected ? '셋리스트 선택 해제' : '셋리스트에 추가'}
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                                song.isSelected
                                  ? 'text-warn'
                                  : 'text-foreground-muted hover:text-warn',
                              )}
                            >
                              <Pin
                                className="h-4 w-4"
                                fill={song.isSelected ? 'currentColor' : 'none'}
                              />
                            </button>
                          )}
                          {canMutate && onEditSong && (
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
                                  : 'text-foreground-muted hover:bg-white/10 hover:text-white',
                              )}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canMutate && onDeleteSong && (
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
                        </>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
