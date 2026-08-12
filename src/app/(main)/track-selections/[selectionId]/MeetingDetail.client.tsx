'use client';

import {
  CheckCircle2,
  ListMusic,
  Lock,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/global/config/routes';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';

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
import { useTrackSelectionItems } from '@/domain/track-selection/hooks/useTrackSelectionItems';
import { useDeleteTrackSelectionItem } from '@/domain/track-selection/hooks/useDeleteTrackSelectionItem';
import { toSong } from '@/domain/track-selection/utils/toSong';
import type { TrackSelectionItemsFilter } from '@/domain/track-selection/types/req';
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

type Filter = 'all' | 'ready' | 'pending' | 'mine';

function buildFilterQuery(filter: Filter): TrackSelectionItemsFilter {
  switch (filter) {
    case 'ready':
      return { status: ['ASSIGN_COMPLETED'] };
    case 'pending':
      return { status: ['OPEN', 'APPLY_COMPLETED'] };
    case 'mine':
      return { appliedByMe: true };
    case 'all':
    default:
      return {};
  }
}

export function MeetingDetail({ meetingId }: { meetingId: string }) {
  // 실API: 선곡 상세 조회
  const {
    data: selection,
    isPending: selectionPending,
    error: selectionError,
  } = useTrackSelection(meetingId);
  const { data: me } = useMe();

  // 실API: 선곡 항목 목록 조회(전체) → mock store에 동기화. 상단 통계(전체/합주가능/모집중)의 기준.
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
  const canManageParticipants = isManager && !isLocked;
  const [pendingLockAction, setPendingLockAction] = useState<'lock' | 'unlock' | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showCreateSetlist, setShowCreateSetlist] = useState(false);
  const [setlistTitle, setSetlistTitle] = useState('');
  const setlistTitleRef = useRef<HTMLInputElement>(null);
  // Enter 키(입력창)와 '생성' 버튼 클릭이 각각 독립적으로 mutate를 호출하던 것을 하나로 합침.
  // createSetlist.isPending 은 리렌더 이후에나 반영되므로, 두 트리거가 리렌더 전에 거의 동시에
  // 들어오면(Enter 직후 곧바로 버튼 클릭 등) 중복 생성될 수 있어 ref로 동기적으로 막는다.
  const isCreatingSetlistRef = useRef(false);
  const createSetlist = useCreateSetlist();
  const updateTrackSelection = useUpdateTrackSelection(meetingId);
  const router = useRouter();
  const toast = useToast();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  // Enter(keydown)와 onBlur가 같은 handleTitleSave를 호출 — 연속 Enter 등으로 리렌더 전에
  // 다시 들어오면 selection.title이 아직 갱신 전이라 가드를 통과해 중복 PATCH가 나갈 수 있어 ref로 막는다.
  const isSavingTitleRef = useRef(false);

  const hasSelectedSongs = allSongs.some((s) => s.isSelected);

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  // 컬럼 정렬 — 재생시간 / 세션 모집 현황. 동일 컬럼 재클릭 시 asc↔desc 토글.
  const [sortKey, setSortKey] = useState<SongSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SongSortDir>('asc');
  // 곡 수정 / 삭제 다이얼로그 상태.
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [pendingDeleteSong, setPendingDeleteSong] = useState<Song | null>(null);
  // 우측 슬라이드 패널 — 세션 지원 / 채팅 탭 전환. 곡을 새로 선택하면 자동 열림.
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'session' | 'chat'>('session');

  useEffect(() => {
    setSelectedMeeting(meetingId);
  }, [meetingId, setSelectedMeeting]);

  // 선택된 곡이 사라지면 패널도 함께 닫음 — 패널은 곡 컨텍스트가 필수.
  useEffect(() => {
    if (!selectedSongId) setPanelOpen(false);
  }, [selectedSongId]);

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

  // 멤버 이름 부분 매칭 → userId 집합. 하이라이트 표시용(실제 필터링은 서버 memberName 파라미터가 담당).
  const matchedUserIds = useMemo(() => {
    const t = memberQuery.trim().toLowerCase();
    if (!t) return new Set<string>();
    return new Set(members.filter((m) => m.name.toLowerCase().includes(t)).map((m) => m.id));
  }, [members, memberQuery]);

  // 검색어는 디바운스 후 서버로 전송 — 매 키입력마다 요청하지 않도록.
  const debouncedQuery = useDebounce(query.trim(), 300);
  const debouncedMemberQuery = useDebounce(memberQuery.trim(), 300);

  const activeFilter = useMemo<TrackSelectionItemsFilter>(
    () => ({
      ...buildFilterQuery(filter),
      ...(debouncedQuery ? { keyword: debouncedQuery } : {}),
      ...(debouncedMemberQuery ? { memberName: debouncedMemberQuery } : {}),
    }),
    [filter, debouncedQuery, debouncedMemberQuery],
  );
  const hasActiveFilter = Object.keys(activeFilter).length > 0;
  // filter='all' + 검색어 없음이면 activeFilter === {} 이고 base 쿼리와 동일한 쿼리키를 사용하므로
  // TanStack Query가 자동으로 요청을 중복 제거한다(불필요한 추가 네트워크 요청 없음).
  // 이 덕분에 무한 스크롤 페이지네이션도 이 쿼리 하나만 구독하면 필터 여부와 무관하게 항상 맞는 상태를 가리킨다.
  const {
    data: filteredItemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTrackSelectionItems(meetingId, 50, activeFilter);
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  const filtered = useMemo(() => {
    if (!hasActiveFilter) return allSongs;
    if (!filteredItemsData) return [];
    // store(allSongs)는 base(무필터) 쿼리가 로드한 페이지만큼만 채워져 있어, 필터 탭에서 더
    // 스크롤해 store 에 없는 항목을 서버가 돌려줄 수 있다 → store 조인 대신 응답을 직접 변환한다.
    let result = filteredItemsData.pages.flatMap((p) => p.content).map(toSong);
    // BE 문서: status 값끼리 겹칠 수 있음(ASSIGN_COMPLETED 항목도 APPLY_COMPLETED 조건을 만족) →
    // '모집 중' 탭에 이미 합주 가능한 곡이 섞여 들어올 수 있어 클라이언트에서 한 번 더 걸러낸다.
    if (filter === 'pending') result = result.filter((s) => !isReady(s));
    return result;
  }, [hasActiveFilter, filteredItemsData, allSongs, filter]);

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
        setPanelOpen(true);
        setPanelTab('session');
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
    if (isSavingTitleRef.current) return;
    isSavingTitleRef.current = true;
    updateTrackSelection.mutate(trimmed, {
      onSuccess: () => {
        toast.success('선곡 이름이 수정되었습니다.');
        setEditingTitle(false);
      },
      onError: () => toast.error('이름 수정에 실패했습니다.'),
      onSettled: () => {
        isSavingTitleRef.current = false;
      },
    });
  };

  const handleCreateSetlist = () => {
    if (isCreatingSetlistRef.current) return;
    isCreatingSetlistRef.current = true;
    createSetlist.mutate(
      { trackSelectionId: meetingId, title: setlistTitle.trim() || undefined },
      {
        onSuccess: (data) => {
          toast.success('셋리스트가 생성되었습니다.');
          setShowCreateSetlist(false);
          router.push(ROUTES.SETLIST_DETAIL(data.setlistId));
        },
        onError: () => toast.error('셋리스트 생성에 실패했습니다.'),
        onSettled: () => {
          isCreatingSetlistRef.current = false;
        },
      },
    );
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
                  <button
                    type="button"
                    onClick={handleTitleEdit}
                    aria-label="선곡 이름 수정"
                    className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowParticipantsModal(true)}
                aria-label={canManageParticipants ? '참여자 관리' : '참여자 목록'}
                className="rounded-[5px]"
              >
                <Users className="h-4 w-4" /> 참여자
              </Button>
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
              // 메인 행 클릭은 항상 세션 탭으로 진입. 같은 행 재클릭 시 패널 토글.
              if (id === selectedSongId) {
                setPanelOpen((v) => !v);
                return;
              }
              setSelectedSong(id);
              setFocusedSession(null);
              setPanelOpen(true);
              setPanelTab('session');
            }}
            onEditSong={(id) => {
              const s = visible.find((x) => x.id === id);
              if (s) setEditingSong(s);
            }}
            onDeleteSong={(id) => {
              const s = visible.find((x) => x.id === id);
              if (s) setPendingDeleteSong(s);
            }}
            onOpenChat={(id) => {
              setSelectedSong(id);
              setFocusedSession(null);
              setPanelOpen(true);
              setPanelTab('chat');
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
          {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {isFetchingNextPage && (
            <div className="px-s-5 py-s-3">
              <Skeleton className="h-12 w-full" />
            </div>
          )}
        </div>
      </div>

      {/* 우측 슬라이드 패널 — 세션 지원 / 채팅 탭 전환. */}
      {selectedSongId && (
        <RightSlidePanel open={panelOpen} width="420px">
          <div className="bg-surface flex h-full w-full flex-col">
            <Tabs
              value={panelTab}
              onValueChange={(v) => setPanelTab(v as 'session' | 'chat')}
              variant="underline"
            >
              <div className="border-border px-s-4 relative border-l">
                <TabsList aria-label="선곡 상세 패널 탭">
                  <TabsTrigger
                    value="session"
                    className="data-[state=active]:border-foreground data-[state=active]:text-foreground"
                  >
                    세션
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="data-[state=active]:border-foreground data-[state=active]:text-foreground"
                  >
                    채팅
                  </TabsTrigger>
                </TabsList>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="패널 닫기"
                  className="text-foreground-muted hover:text-foreground right-s-4 absolute top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Tabs>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {panelTab === 'session' ? (
                <SessionPanel
                  songId={selectedSongId}
                  selectionId={meetingId}
                  members={members}
                  isManager={isManager}
                />
              ) : (
                <MeetingChatBox selectionId={meetingId} songId={selectedSongId} />
              )}
            </div>
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

      {/* 참여자 관리 모달 — 확정 전 매니저만 추가/제거 가능, 그 외(비매니저·확정 후)는 목록 조회만. */}
      {showParticipantsModal && selection && (
        <ParticipantsModal
          selectionId={meetingId}
          bandIds={selection.bandIds}
          participants={selection.participants}
          members={members}
          currentUserId={currentUserId}
          readOnly={!canManageParticipants}
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
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateSetlist();
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
                onClick={handleCreateSetlist}
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
