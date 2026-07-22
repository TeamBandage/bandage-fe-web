'use client';

import {
  CalendarDays,
  CheckCircle2,
  ListMusic,
  Lock,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/global/config/routes';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RightSlidePanel } from '@/components/ui/right-slide-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddSongModal } from '@/domain/setlist-meeting/components/AddSongModal.client';
import { MeetingChatBox } from '@/domain/setlist-meeting/components/MeetingChatBox.client';
import { SessionPanel } from '@/domain/setlist-meeting/components/SessionPanel.client';
import {
  SongTable,
  type SongSortDir,
  type SongSortKey,
} from '@/domain/setlist-meeting/components/SongTable.client';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import { useMe } from '@/domain/member/hooks/useMe';
import { useTrackSelection } from '@/domain/track-selection/hooks/useTrackSelection';
import { useUpdateTrackSelection } from '@/domain/track-selection/hooks/useUpdateTrackSelection';
import { useDeleteTrackSelection } from '@/domain/track-selection/hooks/useDeleteTrackSelection';
import { useTrackSelectionItems } from '@/domain/track-selection/hooks/useTrackSelectionItems';
import { useDeleteTrackSelectionItem } from '@/domain/track-selection/hooks/useDeleteTrackSelectionItem';
import { toSong } from '@/domain/track-selection/utils/toSong';
import { resolveMemberId } from '@/domain/track-selection/utils/resolveMemberId';
import { lockSelection, unlockSelection } from '@/domain/track-selection/api/lockSelection';
import { useUpdateItemSelection } from '@/domain/track-selection/hooks/useUpdateItemSelection';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/global/config/queryKeys';
import type { Member } from '@/domain/setlist-meeting/types';
import { ParticipantsModal } from '@/domain/setlist-meeting/components/ParticipantsModal.client';
import { useCreateSetlist } from '@/domain/setlist/hooks/useCreateSetlist';
import { useToast } from '@/hooks/useToast';
import type { Song } from '@/domain/setlist-meeting/types';
import { confirmedCount, isReady, totalNeed } from '@/domain/setlist-meeting/utils';
import { formatKst, parseKst } from '@/lib/date';

type Filter = 'all' | 'ready' | 'pending' | 'mine';

function formatPracticeDate(dateStr: string): string {
  return formatKst(parseKst(dateStr, 'yyyy-MM-dd'), 'yyyy년 M월 d일');
}

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
  // 실API: 선곡 상세 조회
  const {
    data: selection,
    isPending: selectionPending,
    error: selectionError,
  } = useTrackSelection(meetingId);
  const { data: me } = useMe();

  // 실API: 선곡 항목 목록 조회 → mock store에 동기화
  const { data: itemsData } = useTrackSelectionItems(meetingId, 50);
  const deleteItem = useDeleteTrackSelectionItem(meetingId);
  const toggleSelection = useUpdateItemSelection(meetingId);
  const qc = useQueryClient();

  const members: Member[] = useMemo(
    () =>
      (selection?.participants ?? []).map((p) => {
        const memberId = resolveMemberId(p);
        return {
          id: String(memberId),
          name: p.member?.name ?? `멤버 #${memberId}`,
          role: '',
          avatar: 'var(--color-border-hi)',
          profileImg: p.member?.profileImg,
        };
      }),
    [selection?.participants],
  );

  const songs = useSetlistStore((s) => s.songs);
  const allSongs = useMemo(
    () => songs.filter((song) => song.meetingId === meetingId),
    [songs, meetingId],
  );
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const setCurrentUser = useSetlistStore((s) => s.setCurrentUser);
  const setSongs = useSetlistStore((s) => s.setSongs);
  const selectedSongId = useSetlistStore((s) => s.selectedSongId);
  const setSelectedMeeting = useSetlistStore((s) => s.setSelectedMeeting);
  const setSelectedSong = useSetlistStore((s) => s.setSelectedSong);
  const setFocusedSession = useSetlistStore((s) => s.setFocusedSession);
  const deleteSong = useSetlistStore((s) => s.deleteSong);
  const lockMeeting = useSetlistStore((s) => s.lockMeeting);
  const unlockMeeting = useSetlistStore((s) => s.unlockMeeting);

  const isManager = selection ? selection.managerId === me?.id : false;
  const isLocked = Boolean(selection?.lockedAt);
  const [pendingLockAction, setPendingLockAction] = useState<'lock' | 'unlock' | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showCreateSetlist, setShowCreateSetlist] = useState(false);
  const [setlistTitle, setSetlistTitle] = useState('');
  const setlistTitleRef = useRef<HTMLInputElement>(null);
  const createSetlist = useCreateSetlist();
  const updateTrackSelection = useUpdateTrackSelection(meetingId);
  const deleteTrackSelection = useDeleteTrackSelection(meetingId, {
    onSuccess: () => {
      toast.success('선곡 회의를 삭제했습니다.');
      router.replace(ROUTES.TRACK_SELECTIONS);
    },
    onError: (err) => toast.error(err.message || '선곡 회의 삭제에 실패했습니다.'),
  });
  const router = useRouter();
  const toast = useToast();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [confirmDeleteSelection, setConfirmDeleteSelection] = useState(false);

  const hasSelectedSongs = allSongs.some((s) => s.isSelected);

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  // 우측 세션 패널 토글. 곡을 새로 선택하면 자동 열림.
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  // 컬럼 정렬 — 재생시간 / 세션 모집 현황. 동일 컬럼 재클릭 시 asc↔desc 토글.
  const [sortKey, setSortKey] = useState<SongSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SongSortDir>('asc');
  // 곡 수정 / 삭제 다이얼로그 상태.
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [pendingDeleteSong, setPendingDeleteSong] = useState<Song | null>(null);

  useEffect(() => {
    setSelectedMeeting(meetingId);
  }, [meetingId, setSelectedMeeting]);

  // 실 유저 ID → mock store 동기화 (SessionPanel, SongTable, AddSongModal 공통 기준점)
  useEffect(() => {
    if (me?.id !== undefined) setCurrentUser(String(me.id));
  }, [me?.id, setCurrentUser]);

  // 실 API items → mock store 동기화 (다른 멤버가 추가한 곡도 표시)
  useEffect(() => {
    if (!itemsData) return;
    const realSongs = itemsData.pages.flatMap((p) => p.content).map(toSong);
    setSongs(meetingId, realSongs);
  }, [itemsData, meetingId, setSongs]);

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

  const filtered = useMemo(() => {
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

  // 컬럼 정렬 적용. progress = confirmed/totalNeed 비율, duration = mm*60+ss 초.
  const visible = useMemo(() => {
    if (!sortKey) return filtered;
    const score = (s: Song): number => {
      if (sortKey === 'duration') {
        if (!s.duration) return Number.NEGATIVE_INFINITY;
        const m = s.duration.match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return Number.NEGATIVE_INFINITY;
        return parseInt(m[1]!, 10) * 60 + parseInt(m[2]!, 10);
      }
      const total = totalNeed(s);
      return total === 0 ? 0 : confirmedCount(s) / total;
    };
    return [...filtered].sort((a, b) => {
      const av = score(a);
      const bv = score(b);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const handleToggleSort = (key: SongSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

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
        // Task 25 — 포커스된 곡 행이 항상 보이도록 자동 스크롤.
        // 마이크로태스크 후 호출 — 리스트가 selected 클래스로 재렌더된 다음 스크롤.
        queueMicrotask(() => {
          const row = document.querySelector<HTMLElement>(`[data-song-id="${nextSong.id}"]`);
          row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, selectedSongId, setSelectedSong, setFocusedSession]);

  if (selectionPending) {
    return (
      <div className="px-s-5 py-s-6 space-y-s-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (selectionError || !selection) {
    return (
      <div className="px-s-5 py-s-6">
        <p className="text-foreground-muted text-caption">
          {selectionError?.message ?? '회의를 찾을 수 없습니다.'}
        </p>
      </div>
    );
  }

  const handleTitleEdit = () => {
    setTitleDraft(selection.title);
    setEditingTitle(true);
  };

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === selection.title) {
      setEditingTitle(false);
      return;
    }
    updateTrackSelection.mutate(trimmed, {
      onSuccess: () => {
        toast.success('선곡 이름이 수정되었습니다.');
        setEditingTitle(false);
      },
      onError: () => toast.error('이름 수정에 실패했습니다.'),
    });
  };

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border px-s-5 py-s-4 border-b">
          <div className="min-w-0">
            {editingTitle ? (
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                onBlur={handleTitleSave}
                autoFocus
                className="bg-card border-border text-title-lg mt-s-1 w-full rounded-md border px-3 py-1.5 font-bold outline-none focus:ring-1 focus:ring-current"
              />
            ) : (
              <div className="mt-s-1 flex items-center gap-2">
                <h1 className="text-title-lg font-bold">{selection.title}</h1>
                {isManager && (
                  <>
                    <button
                      type="button"
                      onClick={handleTitleEdit}
                      aria-label="선곡 이름 수정"
                      className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteSelection(true)}
                      aria-label="선곡 회의 삭제"
                      className="text-foreground-muted hover:text-danger rounded p-1 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="mt-s-2">
              <span className="text-foreground-sub text-caption inline-flex items-center gap-1 rounded bg-white/8 px-1.5 py-0.5">
                <CalendarDays className="h-3 w-3" aria-hidden="true" />
                {formatPracticeDate(selection.practiceWindow.from)} ~{' '}
                {formatPracticeDate(selection.practiceWindow.to)}
              </span>
            </div>
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

          {/* 필터 탭 + 검색 + '곡 추가'(매니저) 를 같은 라인에 — 사용자가 표 바로 위에서 즉시 곡을 추가할 수 있도록. */}
          <div className="gap-s-3 mt-s-4 flex flex-col items-stretch md:flex-row md:flex-wrap md:items-center">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                >
                  전체
                </TabsTrigger>
                <TabsTrigger
                  value="ready"
                  className="data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                >
                  합주 가능
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                >
                  모집 중
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                >
                  내 지원
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-[5px] border md:w-60">
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
            <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-[5px] border md:w-52">
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
            <div className="gap-s-2 flex items-center md:ml-auto">
              {isManager && !isLocked && (
                <AddSongModal
                  meetingId={meetingId}
                  trigger={
                    <Button
                      size="sm"
                      variant="primary"
                      aria-label="새 곡 추가"
                      className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200"
                    >
                      <Plus className="h-4 w-4" /> 곡 추가
                    </Button>
                  }
                />
              )}
              {isManager && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowParticipantsModal(true)}
                  aria-label="참여자 관리"
                  className="rounded-[5px]"
                >
                  <Users className="h-4 w-4" /> 참여자
                </Button>
              )}
              {isManager && !isLocked && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setPendingLockAction('lock')}
                  aria-label="선곡 확정"
                  className="bg-success hover:bg-success/90 rounded-[5px] text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> 선곡 확정
                </Button>
              )}
              {isManager && isLocked && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSetlistTitle(selection?.title ?? '');
                    setShowCreateSetlist(true);
                  }}
                  disabled={!hasSelectedSongs}
                  aria-label="셋리스트 생성"
                  aria-disabled={!hasSelectedSongs}
                  className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
                >
                  <ListMusic className="h-4 w-4" /> 셋리스트 생성
                </Button>
              )}
              {isManager && isLocked && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPendingLockAction('unlock')}
                  aria-label="회의 재개"
                  className="rounded-[5px]"
                >
                  <RotateCcw className="h-4 w-4" /> 회의 재개
                </Button>
              )}
            </div>
          </div>

          {/* 잠금 안내 배너 — 모든 멤버에게 노출. */}
          {isLocked && (
            <div className="bg-success-dim border-success/30 mt-s-3 px-s-3 py-s-2 gap-s-2 text-caption text-success flex items-center rounded-md border">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="font-semibold">선곡이 확정된 회의입니다.</span>
              <span className="text-foreground-sub">
                곡 추가/수정/삭제는 잠겨 있습니다.
                {isManager && hasSelectedSongs && (
                  <>
                    {' '}
                    <Pin className="-mt-0.5 inline h-3 w-3" fill="currentColor" /> 표시된{' '}
                    {allSongs.filter((s) => s.isSelected).length}곡으로 셋리스트를 생성할 수
                    있습니다.
                  </>
                )}
                {isManager && !hasSelectedSongs && (
                  <>
                    {' '}
                    회의를 재개한 뒤 <Pin className="-mt-0.5 inline h-3 w-3" /> 아이콘으로 곡을
                    선택하고 다시 확정하세요.
                  </>
                )}
              </span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <SongTable
            songs={visible}
            members={members}
            selectedSongId={selectedSongId}
            currentUserId={currentUserId}
            isManager={isManager}
            isLocked={isLocked}
            matchedUserIds={matchedUserIds}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={handleToggleSort}
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
            onEditSong={(id) => {
              const s = visible.find((x) => x.id === id);
              if (s) setEditingSong(s);
            }}
            onDeleteSong={(id) => {
              const s = visible.find((x) => x.id === id);
              if (s) setPendingDeleteSong(s);
            }}
            onToggleSelection={(id, selected) => {
              // 낙관적 업데이트: 클릭 즉시 store 반영
              setSongs(
                meetingId,
                allSongs.map((s) => (s.id === id ? { ...s, isSelected: selected } : s)),
              );
              toggleSelection.mutate(
                { itemId: id, selected },
                {
                  onError: () => {
                    // 실패 시 롤백
                    setSongs(
                      meetingId,
                      allSongs.map((s) => (s.id === id ? { ...s, isSelected: !selected } : s)),
                    );
                    toast.error(
                      selected
                        ? '곡 선택에 실패했습니다. 모든 세션의 확정 인원이 충족되어야 합니다.'
                        : '곡 선택 해제에 실패했습니다.',
                    );
                  },
                },
              );
            }}
          />
        </div>
      </div>

      {/* 우측 슬라이드 패널 — 세션 패널(좌)과 채팅(우)을 가로로 나란히 배치.
          너비는 고정값이 아니라 사이드바(최대 200px)+곡 목록 최소폭(360px)을 제외한 나머지를
          채팅이 채우도록 뷰포트 기준 calc — 최소 780px, 상한 없이 화면 끝까지 채움. */}
      {selectedSongId && (
        <RightSlidePanel open={sessionPanelOpen} width="max(780px, calc(100vw - 560px))">
          <div className="flex h-full w-[380px] shrink-0">
            <SessionPanel
              songId={selectedSongId}
              selectionId={meetingId}
              members={members}
              isManager={isManager}
            />
          </div>
          <div className="flex h-full min-w-0 flex-1">
            <MeetingChatBox
              selectionId={meetingId}
              songId={selectedSongId}
              onClose={() => setSessionPanelOpen(false)}
            />
          </div>
        </RightSlidePanel>
      )}

      {/* 곡 수정 모달 — 외부에서 open 제어. song 이 있으면 수정 모드로 동작. */}
      {editingSong && (
        <AddSongModal
          meetingId={meetingId}
          song={editingSong}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditingSong(null);
          }}
        />
      )}

      {/* 삭제 확인 다이얼로그 — 브라우저 기본 confirm 대신 디자인 토큰 적용. */}
      <ConfirmDialog
        open={pendingDeleteSong !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDeleteSong(null);
        }}
        title="곡 삭제"
        description={
          pendingDeleteSong ? (
            <>
              <strong className="text-foreground">{pendingDeleteSong.title}</strong> 곡을 정말
              삭제하시겠습니까? 지원/확정 정보도 함께 사라집니다.
            </>
          ) : null
        }
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!pendingDeleteSong) return;
          deleteItem.mutate(pendingDeleteSong.id, {
            onSuccess: () => {
              deleteSong(pendingDeleteSong.id);
              toast.success('곡이 삭제되었습니다.');
            },
            onError: () => {
              toast.error('곡 삭제에 실패했습니다.');
            },
          });
        }}
      />

      {/* 선곡 회의 삭제 확인 다이얼로그 — 매니저 전용. */}
      <ConfirmDialog
        open={confirmDeleteSelection}
        onOpenChange={setConfirmDeleteSelection}
        title="선곡 회의 삭제"
        description={
          <>
            <strong className="text-foreground">{selection.title}</strong> 회의를 정말
            삭제하시겠습니까? 등록된 곡·세션·채팅 내용도 함께 사라지며 복구할 수 없습니다.
          </>
        }
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => deleteTrackSelection.mutate()}
      />

      {/* 참여자 관리 모달 — 매니저 전용. */}
      {showParticipantsModal && selection && (
        <ParticipantsModal
          selectionId={meetingId}
          bandIds={selection.bandIds}
          participants={selection.participants}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setShowParticipantsModal(false)}
        />
      )}

      {/* 셋리스트 생성 다이얼로그 */}
      {showCreateSetlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border-border w-full max-w-sm rounded-xl border shadow-xl">
            <header className="border-border px-s-5 py-s-4 border-b">
              <h2 className="text-title gap-s-2 flex items-center font-bold">
                <ListMusic className="h-4 w-4" /> 셋리스트 생성
              </h2>
              <p className="text-foreground-muted text-caption mt-s-1">
                선택된 곡({allSongs.filter((s) => s.isSelected).length}곡)으로 셋리스트를 만듭니다.
              </p>
            </header>
            <div className="px-s-5 py-s-4">
              <label className="text-caption font-semibold" htmlFor="setlist-title">
                셋리스트 이름 <span className="text-foreground-muted font-normal">(선택)</span>
              </label>
              <input
                ref={setlistTitleRef}
                id="setlist-title"
                type="text"
                value={setlistTitle}
                onChange={(e) => setSetlistTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createSetlist.isPending) {
                    e.preventDefault();
                    createSetlist.mutate(
                      { trackSelectionId: meetingId, title: setlistTitle.trim() || undefined },
                      {
                        onSuccess: (data) => {
                          toast.success('셋리스트가 생성되었습니다.');
                          setShowCreateSetlist(false);
                          router.push(ROUTES.SETLIST_DETAIL(data.setlistId));
                        },
                        onError: () => toast.error('셋리스트 생성에 실패했습니다.'),
                      },
                    );
                  }
                  if (e.key === 'Escape') setShowCreateSetlist(false);
                }}
                placeholder={selection?.title ?? '셋리스트 이름'}
                autoFocus
                className="bg-card border-border text-body placeholder:text-foreground-muted mt-s-2 px-s-3 py-s-2 w-full rounded-[5px] border outline-none focus:ring-1 focus:ring-current"
              />
            </div>
            <footer className="px-s-5 py-s-3 gap-s-2 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCreateSetlist(false)}
                disabled={createSetlist.isPending}
                className="rounded-[5px]"
              >
                취소
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={createSetlist.isPending}
                onClick={() =>
                  createSetlist.mutate(
                    { trackSelectionId: meetingId, title: setlistTitle.trim() || undefined },
                    {
                      onSuccess: (data) => {
                        toast.success('셋리스트가 생성되었습니다.');
                        setShowCreateSetlist(false);
                        router.push(ROUTES.SETLIST_DETAIL(data.setlistId));
                      },
                      onError: () => toast.error('셋리스트 생성에 실패했습니다.'),
                    },
                  )
                }
                className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
              >
                {createSetlist.isPending ? '생성 중…' : '생성'}
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* 선곡 확정 / 회의 재개 확인 다이얼로그 — 매니저 전용 액션. */}
      <ConfirmDialog
        open={pendingLockAction !== null}
        onOpenChange={(o) => {
          if (!o) setPendingLockAction(null);
        }}
        title={pendingLockAction === 'lock' ? '선곡 확정' : '회의 재개'}
        description={
          pendingLockAction === 'lock'
            ? '선곡을 확정하면 모든 멤버의 곡 추가·수정·삭제가 잠깁니다. 진행하시겠습니까?'
            : '회의를 재개하면 다시 곡 추가·수정·삭제가 가능해집니다. 진행하시겠습니까?'
        }
        confirmLabel={pendingLockAction === 'lock' ? '확정' : '재개'}
        onConfirm={async () => {
          try {
            if (pendingLockAction === 'lock') {
              await lockSelection(meetingId);
              lockMeeting(meetingId);
              toast.success('선곡이 확정되었습니다.');
            } else if (pendingLockAction === 'unlock') {
              await unlockSelection(meetingId);
              unlockMeeting(meetingId);
              toast.info('회의가 재개되었습니다.');
            }
            await qc.invalidateQueries({ queryKey: queryKeys.trackSelection.detail(meetingId) });
          } catch {
            toast.error('요청에 실패했습니다.');
          } finally {
            setPendingLockAction(null);
          }
        }}
      />
    </div>
  );
}
