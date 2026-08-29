'use client';

import { ArrowLeft, Clock, Edit2, ExternalLink, Music, Pencil, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMe } from '@/domain/member/hooks/useMe';
import { SetlistParticipantsModal } from '@/domain/setlist/components/SetlistParticipantsModal.client';
import { useCreateJamsFromSetlist } from '@/domain/setlist/hooks/useCreateJamsFromSetlist';
import { useDeleteSetlistTrack } from '@/domain/setlist/hooks/useDeleteSetlistTrack';
import { useSetlist } from '@/domain/setlist/hooks/useSetlist';
import { useSetlistTracks } from '@/domain/setlist/hooks/useSetlistTracks';
import { useUpdateSetlist } from '@/domain/setlist/hooks/useUpdateSetlist';
import { useUpdateSetlistTrack } from '@/domain/setlist/hooks/useUpdateSetlistTrack';
import type { SetlistTrackResponse } from '@/domain/setlist/types/res';
import { ROUTES } from '@/global/config/routes';
import { formatKst } from '@/lib/date';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';

import { SetlistScheduleBoard } from './SetlistScheduleBoard.client';

function TrackRow({
  track,
  onEdit,
  onDelete,
}: {
  track: SetlistTrackResponse;
  onEdit: (track: SetlistTrackResponse) => void;
  onDelete: (track: SetlistTrackResponse) => void;
}) {
  return (
    <div className="border-border hover:bg-card flex items-center gap-4 border-b py-3 pr-5 pl-7.5 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-foreground shrink-0 font-medium">{track.title}</p>
          {track.reference && (
            <a
              href={track.reference}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${track.title} 참고 링크 열기`}
              title="참고 링크"
              className="text-foreground-muted hover:text-foreground shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <p className="text-foreground-muted truncate text-sm">
            {track.artist}
            {track.album && ` · ${track.album}`}
          </p>
        </div>
        {track.sessions && track.sessions.length > 0 && (
          <TooltipProvider delayDuration={0}>
            <div className="mt-1 flex flex-wrap gap-1">
              {track.sessions.map((s) => (
                <Tooltip key={s.sessionId}>
                  <TooltipTrigger asChild>
                    <span className="bg-card border-border rounded px-1.5 py-0.5 text-xs">
                      {s.short}
                      {s.participants.length > 0 && (
                        <span className="text-foreground-muted ml-1">
                          {s.participants.map((p) => p.name).join(', ')}
                        </span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {s.label}
                    {s.participants.length > 0
                      ? `: ${s.participants.map((p) => p.name).join(', ')}`
                      : ' · 미정'}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {track.duration !== undefined && (
          <span className="text-foreground-muted flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {formatDurationLabel(track.duration)}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(track)}
          aria-label={`${track.title} 수정`}
          className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(track)}
          aria-label={`${track.title} 삭제`}
          className="text-foreground-muted hover:text-danger rounded p-1 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function clampNumeric(raw: string, max: number): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 2);
  if (digits === '') return '';
  const n = Math.min(parseInt(digits, 10), max);
  return String(n);
}

function secondsToMmSs(totalSeconds?: number): { mm: string; ss: string } {
  if (totalSeconds === undefined) return { mm: '', ss: '' };
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return { mm: String(mm).padStart(2, '0'), ss: String(ss).padStart(2, '0') };
}

function mmSsToSeconds(mm: string, ss: string): number | undefined {
  if (mm === '' && ss === '') return undefined;
  const m = mm === '' ? 0 : parseInt(mm, 10);
  const s = ss === '' ? 0 : parseInt(ss, 10);
  return m * 60 + s;
}

function formatDurationLabel(totalSeconds: number): string {
  const { mm, ss } = secondsToMmSs(totalSeconds);
  return `${mm}:${ss}`;
}

function TrackEditForm({
  track,
  onSave,
  onCancel,
  isPending,
}: {
  track: SetlistTrackResponse;
  onSave: (values: {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    note?: string;
    reference?: string;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album ?? '');
  const initialDuration = secondsToMmSs(track.duration);
  const [durationMm, setDurationMm] = useState(initialDuration.mm);
  const [durationSs, setDurationSs] = useState(initialDuration.ss);
  const ssInputRef = useRef<HTMLInputElement | null>(null);
  const [note, setNote] = useState(track.note ?? '');
  const [reference, setReference] = useState(track.reference ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || undefined,
      artist: artist.trim() || undefined,
      album: album.trim() || undefined,
      duration: mmSsToSeconds(durationMm, durationSs),
      note: note.trim() || undefined,
      reference: reference.trim() || undefined,
    });
  };

  const inputClass =
    'bg-card border-border text-body placeholder:text-foreground-muted w-full rounded-[5px] border px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-current';

  return (
    <form onSubmit={handleSubmit} className="border-border bg-card space-y-3 border-b px-5 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold" htmlFor={`title-${track.setlistTrackId}`}>
            곡명
          </label>
          <input
            id={`title-${track.setlistTrackId}`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor={`artist-${track.setlistTrackId}`}>
            아티스트
          </label>
          <input
            id={`artist-${track.setlistTrackId}`}
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor={`album-${track.setlistTrackId}`}>
            앨범
          </label>
          <input
            id={`album-${track.setlistTrackId}`}
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="선택"
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor={`duration-mm-${track.setlistTrackId}`}>
            재생 시간
          </label>
          <div className="bg-card border-border hover:border-border-hi mt-1 flex h-9 items-center gap-1 rounded-[5px] border px-3 transition-colors focus-within:ring-1 focus-within:ring-current">
            <input
              id={`duration-mm-${track.setlistTrackId}`}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={durationMm}
              onChange={(e) => {
                const next = clampNumeric(e.target.value, 99);
                setDurationMm(next);
                // 두 자리 입력되면 자동으로 초 필드로 이동.
                if (next.length === 2) ssInputRef.current?.focus();
              }}
              onBlur={() => {
                if (durationMm.length === 1) setDurationMm(durationMm.padStart(2, '0'));
              }}
              placeholder="00"
              aria-label="재생 시간 분"
              className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
            />
            <span className="text-foreground-muted font-mono text-sm">:</span>
            <input
              ref={ssInputRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={durationSs}
              onChange={(e) => setDurationSs(clampNumeric(e.target.value, 59))}
              onBlur={() => {
                if (durationSs.length === 1) setDurationSs(durationSs.padStart(2, '0'));
              }}
              placeholder="00"
              aria-label="재생 시간 초"
              className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold" htmlFor={`note-${track.setlistTrackId}`}>
          노트
        </label>
        <input
          id={`note-${track.setlistTrackId}`}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="선택"
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <div>
        <label className="text-xs font-semibold" htmlFor={`reference-${track.setlistTrackId}`}>
          참고 링크
        </label>
        <input
          id={`reference-${track.setlistTrackId}`}
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="예: https://youtube.com/..."
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-[5px]"
        >
          취소
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={isPending}
          className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
        >
          {isPending ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  );
}

function JamCreateForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (values: { startAt: string; durationMinutes: number; venue?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [venue, setVenue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startAt) return;
    // datetime-local → "yyyy-MM-dd HH:mm" (KST 그대로 사용, UTC 변환 금지)
    const formattedStart = startAt.replace('T', ' ');
    onSubmit({
      startAt: formattedStart,
      durationMinutes,
      venue: venue.trim() || undefined,
    });
  };

  const inputClass =
    'bg-card border-border text-body placeholder:text-foreground-muted w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-current';

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-surface mt-4 space-y-3 rounded-xl border p-5"
    >
      <h3 className="text-sm font-bold">합주 일괄 생성</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold" htmlFor="jam-start">
            시작 일시
          </label>
          <input
            id="jam-start"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor="jam-duration">
            진행 시간 (분)
          </label>
          <input
            id="jam-duration"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor="jam-venue">
            장소
          </label>
          <input
            id="jam-venue"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="선택"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={isPending}>
          취소
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={isPending || !startAt}>
          {isPending ? '생성 중…' : '합주 생성'}
        </Button>
      </div>
    </form>
  );
}

export function SetlistDetail({ setlistId }: { setlistId: string }) {
  const toast = useToast();
  const searchParams = useSearchParams();

  const { data: setlist, isPending: setlistPending, error: setlistError } = useSetlist(setlistId);

  // 트랙 탭 목록 — 스크롤 시 다음 페이지 로드.
  const {
    data: tracksData,
    isPending: tracksPending,
    fetchNextPage: fetchNextTracks,
    hasNextPage: hasNextTracks,
    isFetchingNextPage: isFetchingNextTracks,
  } = useSetlistTracks(setlistId);
  const trackList = useMemo(() => tracksData?.pages.flatMap((p) => p.content) ?? [], [tracksData]);
  const tracksLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextTracks,
    isFetchingNextPage: isFetchingNextTracks,
    fetchNextPage: fetchNextTracks,
  });

  // 시간표 탭(SetlistScheduleBoard)용 — 드래그 배치에 전체 트랙이 필요하므로 스크롤 UI 없이 끝까지 이어받는다.
  // 트랙 탭과는 pageSize가 달라 별도 캐시 키를 쓰므로 서로의 페이지네이션 상태에 영향을 주지 않는다.
  const {
    data: allTracksData,
    fetchNextPage: fetchNextAllTracks,
    hasNextPage: hasNextAllTracks,
    isFetchingNextPage: isFetchingNextAllTracks,
  } = useSetlistTracks(setlistId, 100);
  useEffect(() => {
    if (hasNextAllTracks && !isFetchingNextAllTracks) fetchNextAllTracks();
  }, [hasNextAllTracks, isFetchingNextAllTracks, fetchNextAllTracks]);
  const allTrackList = useMemo(
    () => allTracksData?.pages.flatMap((p) => p.content) ?? [],
    [allTracksData],
  );
  const trackTitleById = useMemo(
    () => new Map(allTrackList.map((t) => [t.setlistTrackId, t.title])),
    [allTrackList],
  );
  const { data: me } = useMe();
  const isManager = setlist ? setlist.managerId === me?.id : false;

  const updateSetlist = useUpdateSetlist(setlistId);
  const updateTrack = useUpdateSetlistTrack(setlistId);
  const deleteTrack = useDeleteSetlistTrack(setlistId);
  const createJams = useCreateJamsFromSetlist(setlistId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  // Enter(keydown)와 onBlur가 같은 handleTitleSave를 호출 — 연속 Enter 등으로 리렌더 전에
  // 다시 들어오면 setlist.title이 아직 갱신 전이라 가드를 통과해 중복 PATCH가 나갈 수 있어 ref로 막는다.
  const isSavingTitleRef = useRef(false);
  const [editingTrack, setEditingTrack] = useState<SetlistTrackResponse | null>(null);
  const [pendingDeleteTrack, setPendingDeleteTrack] = useState<SetlistTrackResponse | null>(null);
  const [showJamForm, setShowJamForm] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'tracks');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') ?? 'tracks');
  }, [searchParams]);

  const handleTitleEdit = () => {
    setTitleInput(setlist?.title ?? '');
    setEditingTitle(true);
  };

  const handleTitleSave = () => {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === setlist?.title) {
      setEditingTitle(false);
      return;
    }
    if (isSavingTitleRef.current) return;
    isSavingTitleRef.current = true;
    updateSetlist.mutate(trimmed, {
      onSuccess: () => {
        toast.success('셋리스트 제목이 수정되었습니다.');
        setEditingTitle(false);
      },
      onError: () => toast.error('제목 수정에 실패했습니다.'),
      onSettled: () => {
        isSavingTitleRef.current = false;
      },
    });
  };

  const handleTrackSave = (values: {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    note?: string;
    reference?: string;
  }) => {
    if (!editingTrack) return;
    updateTrack.mutate(
      { trackId: editingTrack.setlistTrackId, body: values },
      {
        onSuccess: () => {
          toast.success('트랙이 수정되었습니다.');
          setEditingTrack(null);
        },
        onError: () => toast.error('트랙 수정에 실패했습니다.'),
      },
    );
  };

  const handleTrackDelete = () => {
    if (!pendingDeleteTrack) return;
    deleteTrack.mutate(pendingDeleteTrack.setlistTrackId, {
      onSuccess: () => {
        toast.success('트랙이 삭제되었습니다.');
        setPendingDeleteTrack(null);
      },
      onError: () => toast.error('트랙 삭제에 실패했습니다.'),
    });
  };

  const handleJamCreate = (values: {
    startAt: string;
    durationMinutes: number;
    venue?: string;
  }) => {
    createJams.mutate(values, {
      onSuccess: () => {
        toast.success('합주가 일괄 생성되었습니다.');
        setShowJamForm(false);
      },
      onError: () => toast.error('합주 생성에 실패했습니다.'),
    });
  };

  if (setlistPending) {
    return (
      <div className="space-y-3 px-5 py-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (setlistError || !setlist) {
    return (
      <div className="px-5 py-6">
        <p className="text-foreground-muted text-sm">
          {setlistError?.message ?? '셋리스트를 찾을 수 없습니다.'}
        </p>
      </div>
    );
  }

  const hasTrack = trackList.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 헤더 */}
      <header className="border-border border-b px-5 py-4">
        <Link
          href={ROUTES.SETLISTS}
          className="text-foreground-muted hover:text-foreground mb-3 flex items-center gap-1 text-sm no-underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          셋리스트 목록
        </Link>

        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              onBlur={handleTitleSave}
              autoFocus
              className="bg-card border-border text-title flex-1 rounded-md border px-3 py-1.5 font-bold outline-none focus:ring-1 focus:ring-current"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-title font-bold">{setlist.title}</h1>
            <button
              type="button"
              onClick={handleTitleEdit}
              aria-label="셋리스트 제목 수정"
              className="text-foreground-muted hover:text-foreground rounded p-1 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-1 flex items-center justify-between">
          {setlist.createdAt ? (
            <p className="text-foreground-muted text-xs">
              생성일: {formatKst(new Date(setlist.createdAt))}
            </p>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowParticipantsModal(true)}
            aria-label="참여자 목록"
            className="rounded-[5px]"
          >
            <Users className="h-4 w-4" /> 참여자
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        variant="underline"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="px-5">
          <TabsList aria-label="셋리스트 상세 탭">
            <TabsTrigger
              value="tracks"
              className="data-[state=active]:border-foreground data-[state=active]:text-foreground"
            >
              트랙
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:border-foreground data-[state=active]:text-foreground"
            >
              시간표
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 트랙 목록 */}
        <TabsContent value="tracks" className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {tracksPending ? (
            <div className="space-y-2 px-5 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !hasTrack ? (
            <EmptyState icon={Music} title="아직 트랙이 없습니다" className="py-16" />
          ) : (
            <div>
              {trackList.map((track) =>
                editingTrack?.setlistTrackId === track.setlistTrackId ? (
                  <TrackEditForm
                    key={track.setlistTrackId}
                    track={track}
                    onSave={handleTrackSave}
                    onCancel={() => setEditingTrack(null)}
                    isPending={updateTrack.isPending}
                  />
                ) : (
                  <TrackRow
                    key={track.setlistTrackId}
                    track={track}
                    onEdit={setEditingTrack}
                    onDelete={setPendingDeleteTrack}
                  />
                ),
              )}
              {hasNextTracks && <div ref={tracksLoadMoreRef} className="h-4" aria-hidden="true" />}
              {isFetchingNextTracks && (
                <div className="space-y-2 px-5 py-4">
                  <Skeleton className="h-14 w-full" />
                </div>
              )}
            </div>
          )}

          {/* 합주 일괄 생성 */}
          <div className="px-5 py-4">
            {showJamForm ? (
              <JamCreateForm
                onSubmit={handleJamCreate}
                onCancel={() => setShowJamForm(false)}
                isPending={createJams.isPending}
              />
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasTrack}
                onClick={() => setShowJamForm(true)}
              >
                합주 일괄 생성
              </Button>
            )}
          </div>
        </TabsContent>

        {/* 합주 시간표 시안 — 드래그로 트랙 배치 */}
        <TabsContent value="schedule" className="mt-0 flex min-h-0 flex-1 flex-col">
          <SetlistScheduleBoard setlistId={setlistId} tracks={allTrackList} isManager={isManager} />
        </TabsContent>
      </Tabs>

      {/* 트랙 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={pendingDeleteTrack !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDeleteTrack(null);
        }}
        title="트랙 삭제"
        description={
          pendingDeleteTrack ? (
            <>
              <strong className="text-foreground">{pendingDeleteTrack.title}</strong> 트랙을 정말
              삭제하시겠습니까?
            </>
          ) : null
        }
        confirmLabel="삭제"
        tone="danger"
        onConfirm={handleTrackDelete}
      />

      {showParticipantsModal && (
        <SetlistParticipantsModal
          setlistId={setlistId}
          trackTitleById={trackTitleById}
          isManager={isManager}
          currentMemberId={me?.id}
          onClose={() => setShowParticipantsModal(false)}
        />
      )}
    </div>
  );
}
