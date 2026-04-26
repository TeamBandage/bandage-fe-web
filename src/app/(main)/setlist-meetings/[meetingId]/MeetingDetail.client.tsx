'use client';

import { PanelRightOpen, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddSongModal } from '@/domain/setlist-meeting/components/AddSongModal.client';
import { MeetingChatBox } from '@/domain/setlist-meeting/components/MeetingChatBox.client';
import { SessionPanel } from '@/domain/setlist-meeting/components/SessionPanel.client';
import { SongTable } from '@/domain/setlist-meeting/components/SongTable.client';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Song } from '@/domain/setlist-meeting/types';
import { isReady } from '@/domain/setlist-meeting/utils';
import { cn } from '@/lib/cn';

type Filter = 'all' | 'ready' | 'pending' | 'mine';

function applyFilter(songs: Song[], filter: Filter, currentUserId: string): Song[] {
  switch (filter) {
    case 'ready':
      return songs.filter(isReady);
    case 'pending':
      return songs.filter((s) => !isReady(s));
    case 'mine':
      return songs.filter((s) =>
        Object.values(s.applicants).some((list) => list.includes(currentUserId)),
      );
    case 'all':
    default:
      return songs;
  }
}

function applySearch(songs: Song[], q: string): Song[] {
  const t = q.trim().toLowerCase();
  if (!t) return songs;
  return songs.filter(
    (s) =>
      s.title.toLowerCase().includes(t) ||
      s.artist.toLowerCase().includes(t) ||
      (s.album ?? '').toLowerCase().includes(t),
  );
}

export function MeetingDetail({ meetingId }: { meetingId: string }) {
  // selector 내부에서 find/filter 같은 새 참조를 만들면 useSyncExternalStore 가 매 렌더마다 변경으로 인식해 무한 루프.
  // 배열 자체(stable reference)를 select 하고 파생값은 useMemo 로 계산.
  const meetings = useSetlistStore((s) => s.meetings);
  const songs = useSetlistStore((s) => s.songs);
  const meeting = useMemo(() => meetings.find((m) => m.id === meetingId), [meetings, meetingId]);
  const allSongs = useMemo(
    () => songs.filter((song) => song.meetingId === meetingId),
    [songs, meetingId],
  );
  const members = useSetlistStore((s) => s.members);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const selectedSongId = useSetlistStore((s) => s.selectedSongId);
  const setSelectedMeeting = useSetlistStore((s) => s.setSelectedMeeting);
  const setSelectedSong = useSetlistStore((s) => s.setSelectedSong);
  const setFocusedSession = useSetlistStore((s) => s.setFocusedSession);
  const deleteSong = useSetlistStore((s) => s.deleteSong);

  const isManager = meeting ? meeting.managerId === currentUserId : false;

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  // 우측 세션 패널 토글. 곡을 새로 선택하면 자동 열림.
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);

  useEffect(() => {
    setSelectedMeeting(meetingId);
  }, [meetingId, setSelectedMeeting]);

  const stats = useMemo(() => {
    const total = allSongs.length;
    const readyCount = allSongs.filter(isReady).length;
    return { total, ready: readyCount, pending: total - readyCount };
  }, [allSongs]);

  // 멤버 이름 부분 매칭 → userId 집합. 빈 검색이면 빈 Set.
  const matchedUserIds = useMemo(() => {
    const t = memberQuery.trim().toLowerCase();
    if (!t) return new Set<string>();
    return new Set(members.filter((m) => m.name.toLowerCase().includes(t)).map((m) => m.id));
  }, [members, memberQuery]);

  const visible = useMemo(() => {
    let result = applySearch(applyFilter(allSongs, filter, currentUserId), query);
    if (matchedUserIds.size > 0) {
      // 곡 필터 + 멤버 필터 AND: 매칭 유저가 어떤 세션이든 들어있는 곡만.
      result = result.filter(
        (s) =>
          Object.values(s.applicants).some((list) => list.some((u) => matchedUserIds.has(u))) ||
          Object.values(s.confirmed).some((list) => list.some((u) => matchedUserIds.has(u))),
      );
    }
    return result;
  }, [allSongs, filter, currentUserId, query, matchedUserIds]);

  // ↑/↓ 키보드 네비게이션 — 입력 필드 포커스 시에는 무시. 이동 시 focusedSession 정리(overview 모드).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (visible.length === 0) return;
      e.preventDefault();
      const idx = selectedSongId ? visible.findIndex((s) => s.id === selectedSongId) : -1;
      let nextIdx: number;
      if (idx < 0) {
        nextIdx = e.key === 'ArrowDown' ? 0 : visible.length - 1;
      } else {
        nextIdx =
          e.key === 'ArrowUp' ? Math.max(0, idx - 1) : Math.min(visible.length - 1, idx + 1);
      }
      const nextSong = visible[nextIdx];
      if (!nextSong) return;
      if (nextSong.id !== selectedSongId) {
        setSelectedSong(nextSong.id);
        setFocusedSession(null);
        setSessionPanelOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, selectedSongId, setSelectedSong, setFocusedSession]);

  if (!meeting) {
    return (
      <div className="px-s-5 py-s-6">
        <p className="text-foreground-muted text-caption">회의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border px-s-5 py-s-4 border-b">
          <div className="gap-s-3 flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-accent text-caption font-semibold">{meeting.bandName}</div>
              <h1 className="text-title-lg mt-s-1 font-bold">{meeting.title}</h1>
              <div className="text-foreground-muted text-caption gap-s-3 mt-s-2 flex flex-wrap items-center">
                <span>
                  전체 <strong className="text-foreground">{stats.total}</strong>곡
                </span>
                <span className="text-success">
                  합주 가능 <strong>{stats.ready}</strong>
                </span>
                <span className="text-warn">
                  모집 중 <strong>{stats.pending}</strong>
                </span>
              </div>
            </div>
            {isManager && (
              <AddSongModal
                meetingId={meetingId}
                trigger={
                  <Button size="sm" variant="accent-outline" aria-label="새 곡 추가">
                    <Plus className="h-4 w-4" /> 곡 추가
                  </Button>
                }
              />
            )}
          </div>

          {/* 필터 탭 + 검색을 같은 라인 좌측에 인라인 배치 — 우측 380px 오버레이가 검색을 가리지 않도록. */}
          <div className="gap-s-3 mt-s-4 flex flex-col items-stretch md:flex-row md:items-center">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="ready">합주 가능</TabsTrigger>
                <TabsTrigger value="pending">모집 중</TabsTrigger>
                <TabsTrigger value="mine">내 지원</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border md:w-60">
              <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="곡명 · 아티스트 · 앨범"
                aria-label="곡 검색"
                className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
              />
            </div>
            <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border md:w-52">
              <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="멤버 이름"
                aria-label="멤버 검색"
                className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <SongTable
            songs={visible}
            members={members}
            selectedSongId={selectedSongId}
            currentUserId={currentUserId}
            isManager={isManager}
            matchedUserIds={matchedUserIds}
            onSelectSong={(id) => {
              // 메인 행 클릭은 항상 overview 모드로 진입. 세션 focus 는 우측 패널에서만.
              if (id === selectedSongId) {
                setSessionPanelOpen((v) => !v);
                return;
              }
              setSelectedSong(id);
              setFocusedSession(null);
              setSessionPanelOpen(true);
            }}
            onDeleteSong={(id) => deleteSong(id)}
          />
        </div>
        {/* 메인 컬럼 하단 채팅 — 우측 패널과 sessionPanelOpen 으로 동기 토글.
            우측 absolute 패널(z-20)보다 위에 보이도록 relative z-30. */}
        {selectedSongId && sessionPanelOpen && (
          <div className="relative z-30">
            <MeetingChatBox songId={selectedSongId} />
          </div>
        )}
      </div>

      {/* 우측 오버레이 SessionPanel — 메인 차트 위로 absolute. */}
      {selectedSongId && (
        <aside
          aria-hidden={!sessionPanelOpen}
          // 하단 채팅(h-280)과 동시에 열리므로 우측 패널은 채팅 영역을 침범하지 않도록 bottom-[280px].
          // 패널 body 는 자체 overflow-y-auto 라 작은 뷰포트에서도 자연 스크롤.
          className={cn(
            'absolute top-0 right-0 bottom-[280px] z-20 hidden shadow-lg transition-transform duration-200 ease-out lg:flex',
            sessionPanelOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
          )}
          style={{ width: 380 }}
        >
          <SessionPanel songId={selectedSongId} onClose={() => setSessionPanelOpen(false)} />
        </aside>
      )}

      {/* 닫혔을 때 다시 열기 핸들. */}
      {selectedSongId && !sessionPanelOpen && (
        <button
          type="button"
          onClick={() => setSessionPanelOpen(true)}
          aria-label="세션 패널 열기"
          className="bg-surface border-border text-foreground-sub hover:bg-card hover:text-foreground top-s-3 right-s-3 absolute z-30 hidden h-8 w-8 items-center justify-center rounded-md border shadow-sm transition-colors lg:inline-flex"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
