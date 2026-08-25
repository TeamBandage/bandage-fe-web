'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, MapPin, Music, Search, Trash2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JamScheduleBadge } from '@/domain/jam/components/JamScheduleBadge';
import { SessionCreateForm } from '@/domain/jam/components/SessionCreateForm.client';
import { SessionRow } from '@/domain/jam/components/SessionRow';
import { SessionsBulkEditModal } from '@/domain/jam/components/SessionsBulkEditModal.client';
import { useAddParticipant } from '@/domain/jam/hooks/useAddParticipant';
import { useAddParticipantSession } from '@/domain/jam/hooks/useAddParticipantSession';
import { useDeleteJam } from '@/domain/jam/hooks/useDeleteJam';
import { useDeleteParticipant } from '@/domain/jam/hooks/useDeleteParticipant';
import { useJam } from '@/domain/jam/hooks/useJam';
import { useRemoveParticipantSession } from '@/domain/jam/hooks/useRemoveParticipantSession';
import { useUpdateSchedule } from '@/domain/jam/hooks/useUpdateSchedule';
import { useUpdateVenue } from '@/domain/jam/hooks/useUpdateVenue';
import { addParticipantSchema, type AddParticipantSchema } from '@/domain/jam/types';
import { useMemberSearch } from '@/domain/member/hooks/useMemberSearch';
import type { MemberSearchItemResponse } from '@/domain/member/types';
import { ROUTES } from '@/global/config/routes';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';

function toDatetimeLocal(kst: string) {
  // "yyyy-MM-dd HH:mm" -> "YYYY-MM-DDTHH:mm"
  return kst.replace(' ', 'T');
}
function fromDatetimeLocal(dt: string) {
  return dt.replace('T', ' ').slice(0, 16);
}
function formatDuration(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function JamDetailContent({
  jamId,
  onAfterDelete,
}: {
  jamId: string;
  onAfterDelete?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { data: practice, isLoading, isError, refetch } = useJam(jamId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'song');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') ?? 'song');
  }, [searchParams]);

  const scheduleForm = useForm<{ startAt: string; durationMinutes: number }>({
    defaultValues: { startAt: '', durationMinutes: 60 },
  });

  useEffect(() => {
    if (practice) {
      scheduleForm.reset({
        startAt: toDatetimeLocal(practice.startAt),
        durationMinutes: practice.durationMinutes,
      });
    }
  }, [practice?.startAt, practice?.durationMinutes]);

  const [venueValue, setVenueValue] = useState('');
  useEffect(() => {
    if (practice) setVenueValue(practice.venue ?? '');
  }, [practice?.venue]);

  const updateVenueMutation = useUpdateVenue(jamId, {
    onSuccess: () => toast.success('장소가 수정되었습니다.'),
    onError: (err) => toast.error(err.message || '장소 수정에 실패했습니다.'),
  });

  const updateScheduleMutation = useUpdateSchedule(jamId, {
    onSuccess: () => {
      toast.success('일정이 변경되었습니다.');
    },
    onError: (err) => toast.error(err.message || '일정 변경에 실패했습니다.'),
  });

  const deleteMutation = useDeleteJam(jamId, {
    onSuccess: () => {
      toast.success('합주가 삭제되었습니다.');
      if (onAfterDelete) {
        onAfterDelete();
      } else {
        router.replace(ROUTES.JAMS);
      }
    },
    onError: (err) => toast.error(err.message || '합주 삭제에 실패했습니다.'),
  });

  const [sessionAssignTarget, setSessionAssignTarget] = useState<{
    participantId: string;
    displayName: string;
  } | null>(null);
  const [pendingRemoveParticipant, setPendingRemoveParticipant] = useState<{
    participantId: string;
    displayName: string;
  } | null>(null);

  const addParticipantForm = useForm<AddParticipantSchema>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: { memberId: undefined as unknown as number, sessionId: '' },
  });
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberSearchItemResponse | null>(null);
  const {
    data: memberSearchData,
    isFetching: searchingMembers,
    fetchNextPage: fetchNextMemberSearch,
    hasNextPage: hasNextMemberSearch,
    isFetchingNextPage: isFetchingNextMemberSearch,
  } = useMemberSearch(memberQuery, 20);
  const memberSearchResults = memberSearchData?.pages.flatMap((p) => p.content) ?? [];
  const memberSearchLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextMemberSearch,
    isFetchingNextPage: isFetchingNextMemberSearch,
    fetchNextPage: fetchNextMemberSearch,
  });

  const resetAddParticipantForm = () => {
    addParticipantForm.reset({ memberId: undefined as unknown as number, sessionId: '' });
    setSelectedMember(null);
    setMemberQuery('');
  };

  const addParticipantMutation = useAddParticipant(jamId, {
    onSuccess: () => {
      toast.success('참여자가 추가되었습니다.');
      resetAddParticipantForm();
    },
    onError: (err) => toast.error(err.message || '참여자 추가에 실패했습니다.'),
  });

  const addParticipantSessionMutation = useAddParticipantSession(jamId, {
    onSuccess: () => toast.success('세션을 배정했습니다.'),
    onError: (err) => toast.error(err.message || '세션 배정에 실패했습니다.'),
  });

  const removeParticipantSessionMutation = useRemoveParticipantSession(jamId, {
    onSuccess: () => toast.success('세션 배정을 해제했습니다.'),
    onError: (err) => toast.error(err.message || '세션 배정 해제에 실패했습니다.'),
  });

  const deleteParticipantMutation = useDeleteParticipant(jamId, {
    onSuccess: () => {
      toast.success('참여자를 제거했습니다.');
      setPendingRemoveParticipant(null);
    },
    onError: (err) => toast.error(err.message || '참여자 제거에 실패했습니다.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" rounded="lg" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );
  }

  if (isError || !practice) {
    return <ErrorState title="합주를 찾을 수 없습니다" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="space-y-3">
          <h1 className="text-foreground text-xl font-bold">{practice.title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <JamScheduleBadge
              startAt={practice.startAt}
              durationMinutes={practice.durationMinutes}
            />
            {practice.venue && (
              <span className="text-foreground-sub inline-flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {practice.venue}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger
            value="song"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            곡
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            일정
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            세션
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            참여자
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <Card padding="md">
            <div className="space-y-4">
              <form
                className="space-y-2"
                onSubmit={scheduleForm.handleSubmit((values) =>
                  updateScheduleMutation.mutate({
                    startAt: fromDatetimeLocal(values.startAt),
                    durationMinutes: Number(values.durationMinutes),
                  }),
                )}
              >
                <p className="text-foreground-sub text-sm font-medium">일정</p>
                <div
                  className="grid gap-x-3 gap-y-1.5"
                  style={{ gridTemplateColumns: '2fr 1fr auto' }}
                >
                  <span className="text-foreground text-xs font-medium">시작 시각</span>
                  <span className="text-foreground text-xs font-medium">소요 시간 (분)</span>
                  <span />
                  <Input
                    type="datetime-local"
                    className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-70"
                    {...scheduleForm.register('startAt')}
                  />
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
                    {...scheduleForm.register('durationMinutes', { valueAsNumber: true })}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-10 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
                    loading={updateScheduleMutation.isPending}
                  >
                    저장
                  </Button>
                </div>
              </form>
              <div className="space-y-1.5">
                <p className="text-foreground-sub text-sm font-medium">장소</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: '1fr auto' }}>
                  <Input
                    placeholder="장소를 입력하세요"
                    value={venueValue}
                    onChange={(e) => setVenueValue(e.target.value)}
                    className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
                  />
                  <Button
                    variant="secondary"
                    className="h-10 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
                    loading={updateVenueMutation.isPending}
                    onClick={() => updateVenueMutation.mutate({ venue: venueValue.trim() })}
                  >
                    저장
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="song">
          <Card header="합주곡" padding="md">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Music className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground truncate text-sm font-medium">
                    {practice.track.title} — {practice.track.artist}
                  </span>
                </div>
                {practice.track.duration != null && (
                  <span className="text-foreground-muted shrink-0 font-mono text-xs tabular-nums">
                    {formatDuration(practice.track.duration)}
                  </span>
                )}
              </div>
              {practice.track.reference && (
                <a
                  href={practice.track.reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-hi inline-flex items-center gap-1 text-sm hover:underline"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  참조 링크 보기
                </a>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card
            header={
              <div className="flex items-center justify-between">
                <span>세션 편성</span>
                <SessionsBulkEditModal jamId={jamId} sessions={practice.sessions} />
              </div>
            }
            padding="md"
          >
            <div className="space-y-4">
              <SessionCreateForm jamId={jamId} />
              {practice.sessions.length === 0 ? (
                <EmptyState title="등록된 세션이 없습니다" compact />
              ) : (
                <div>
                  {practice.sessions.map((s) => (
                    <SessionRow key={s.sessionId} jamId={jamId} session={s} />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card header="참여자" padding="md" className="overflow-visible">
            <div className="space-y-4">
              <form
                onSubmit={addParticipantForm.handleSubmit((values) =>
                  addParticipantMutation.mutate(values),
                )}
                noValidate
              >
                <div
                  className="grid gap-x-3 gap-y-1.5"
                  style={{ gridTemplateColumns: '1fr 1fr auto' }}
                >
                  <span className="text-foreground text-xs font-medium">멤버 검색</span>
                  <span className="text-foreground text-xs font-medium">세션 선택</span>
                  <span />
                  <div className="relative">
                    {selectedMember ? (
                      <div className="bg-surface border-border gap-s-2 px-s-3 flex h-10 items-center rounded-[5px] border">
                        <Avatar
                          size="sm"
                          src={selectedMember.profileImg ?? undefined}
                          fallback={selectedMember.name}
                        />
                        <span className="text-body flex-1 truncate text-sm">
                          {selectedMember.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(null);
                            addParticipantForm.setValue('memberId', undefined as unknown as number);
                          }}
                          aria-label="선택 취소"
                          className="text-foreground-muted hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="bg-surface border-border gap-s-2 px-s-3 flex h-10 items-center rounded-[5px] border">
                        <Search
                          className="text-foreground-muted h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <input
                          type="search"
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                          placeholder="이름 · 이메일로 검색"
                          aria-label="멤버 검색"
                          className="text-body placeholder:text-foreground-muted w-full bg-transparent text-sm outline-none"
                        />
                      </div>
                    )}
                    {!selectedMember && memberQuery.trim() && (
                      <ul className="bg-surface border-border absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[5px] border shadow-lg">
                        {searchingMembers ? (
                          <li className="text-foreground-muted px-s-3 py-s-2 text-xs">검색 중…</li>
                        ) : memberSearchResults.length === 0 ? (
                          <li className="text-foreground-muted px-s-3 py-s-2 text-xs">
                            일치하는 멤버가 없습니다.
                          </li>
                        ) : (
                          <>
                            {memberSearchResults.map((m) => (
                              <li key={m.memberId}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMember(m);
                                    addParticipantForm.setValue('memberId', m.memberId, {
                                      shouldValidate: true,
                                    });
                                    setMemberQuery('');
                                  }}
                                  className="hover:bg-card gap-s-2 px-s-3 py-s-2 flex w-full items-center text-left"
                                >
                                  <Avatar
                                    size="sm"
                                    src={m.profileImg ?? undefined}
                                    fallback={m.name}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">{m.name}</div>
                                    <div className="text-foreground-muted truncate text-xs">
                                      {m.email}
                                    </div>
                                  </div>
                                </button>
                              </li>
                            ))}
                            {hasNextMemberSearch && (
                              <li aria-hidden="true">
                                <div ref={memberSearchLoadMoreRef} className="h-4" />
                              </li>
                            )}
                            {isFetchingNextMemberSearch && (
                              <li className="px-s-3 py-s-2">
                                <Skeleton className="h-8 w-full" rounded="md" />
                              </li>
                            )}
                          </>
                        )}
                      </ul>
                    )}
                  </div>
                  <Select
                    placeholder="세션을 선택하세요"
                    options={practice.sessions
                      .filter((s) => s.participants.length === 0)
                      .map((s) => ({
                        value: s.sessionId,
                        label: `${s.short} · ${s.label}`,
                      }))}
                    className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
                    disabled={
                      practice.sessions.filter((s) => s.participants.length === 0).length === 0
                    }
                    {...addParticipantForm.register('sessionId')}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-10 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
                    loading={addParticipantMutation.isPending}
                  >
                    추가
                  </Button>
                </div>
                {(addParticipantForm.formState.errors.memberId ||
                  addParticipantForm.formState.errors.sessionId) && (
                  <p className="text-danger mt-1.5 text-xs">
                    {addParticipantForm.formState.errors.memberId?.message ??
                      addParticipantForm.formState.errors.sessionId?.message}
                  </p>
                )}
              </form>
              {practice.participants.length === 0 ? (
                <EmptyState title="참여자가 없습니다" compact />
              ) : (
                <ul className="divide-border divide-y">
                  {practice.participants.map((p) => {
                    const mySessions = practice.sessions.filter((s) =>
                      p.sessionIds.includes(s.sessionId),
                    );
                    return (
                      <li
                        key={p.participantId}
                        className="py-s-2 flex items-center justify-between gap-3 last:pb-0"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar
                            size="sm"
                            src={p.member?.profileImg ?? undefined}
                            fallback={p.member?.name}
                          />
                          <span className="text-foreground-sub truncate text-sm">
                            {p.member?.name ?? `멤버 #${p.member?.memberId ?? p.participantId}`}
                            {mySessions.length > 0 && (
                              <span className="text-foreground-muted ml-2">
                                · {mySessions.map((s) => s.label).join(', ')}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={mySessions.length > 0 ? undefined : 'text-blue'}
                            onClick={() =>
                              setSessionAssignTarget({
                                participantId: p.participantId,
                                displayName:
                                  p.member?.name ??
                                  `멤버 #${p.member?.memberId ?? p.participantId}`,
                              })
                            }
                          >
                            {mySessions.length > 0 ? '세션 변경' : '세션 배정'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-foreground-muted"
                            onClick={() =>
                              setPendingRemoveParticipant({
                                participantId: p.participantId,
                                displayName:
                                  p.member?.name ??
                                  `멤버 #${p.member?.memberId ?? p.participantId}`,
                              })
                            }
                          >
                            참여자 제거
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={sessionAssignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSessionAssignTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세션 배정</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              {(() => {
                const target = practice.participants.find(
                  (p) => p.participantId === sessionAssignTarget?.participantId,
                );
                const mySessionIds = target?.sessionIds ?? [];
                const candidates = practice.sessions.filter(
                  (s) => s.participants.length === 0 || mySessionIds.includes(s.sessionId),
                );
                if (candidates.length === 0) {
                  return (
                    <p className="text-foreground-muted text-sm">
                      <strong className="text-foreground font-bold">
                        {sessionAssignTarget?.displayName}
                      </strong>
                      에게 배정 가능한 세션이 없습니다.
                    </p>
                  );
                }
                return (
                  <>
                    <p className="text-foreground-muted text-sm">
                      <strong className="text-foreground font-bold">
                        {sessionAssignTarget?.displayName}
                      </strong>
                      에게 배정할 세션을 선택하세요. 여러 개 선택할 수 있습니다.
                    </p>
                    <ul className="space-y-1">
                      {candidates.map((s) => {
                        const checked = mySessionIds.includes(s.sessionId);
                        const pending =
                          (addParticipantSessionMutation.isPending &&
                            addParticipantSessionMutation.variables?.participantId ===
                              sessionAssignTarget?.participantId &&
                            addParticipantSessionMutation.variables?.sessionId === s.sessionId) ||
                          (removeParticipantSessionMutation.isPending &&
                            removeParticipantSessionMutation.variables?.participantId ===
                              sessionAssignTarget?.participantId &&
                            removeParticipantSessionMutation.variables?.sessionId === s.sessionId);
                        return (
                          <li key={s.sessionId}>
                            <label className="hover:bg-card gap-s-2 px-s-2 py-s-1.5 flex cursor-pointer items-center rounded-[5px]">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-white"
                                checked={checked}
                                disabled={pending}
                                onChange={() => {
                                  if (!sessionAssignTarget) return;
                                  if (checked) {
                                    removeParticipantSessionMutation.mutate({
                                      participantId: sessionAssignTarget.participantId,
                                      sessionId: s.sessionId,
                                    });
                                  } else {
                                    addParticipantSessionMutation.mutate({
                                      participantId: sessionAssignTarget.participantId,
                                      sessionId: s.sessionId,
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {s.short} · {s.label}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              })()}
            </div>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="secondary"
              className="h-8 rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
              onClick={() => setSessionAssignTarget(null)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingRemoveParticipant !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveParticipant(null);
        }}
      >
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>참여자를 제거하시겠어요?</DialogTitle>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody className="pt-2">
            <DialogDescription className="text-foreground-sub text-sm">
              <strong className="text-foreground">{pendingRemoveParticipant?.displayName}</strong>
              님을 합주에서 제거합니다. 보유한 세션 배정도 함께 삭제됩니다.
            </DialogDescription>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => setPendingRemoveParticipant(null)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              loading={deleteParticipantMutation.isPending}
              onClick={() => {
                if (!pendingRemoveParticipant) return;
                deleteParticipantMutation.mutate(pendingRemoveParticipant.participantId);
              }}
            >
              제거하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-start">
        <Button
          size="sm"
          variant="ghost"
          className="text-danger hover:opacity-80"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          합주 삭제
        </Button>
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmText('');
        }}
      >
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>합주를 삭제하시겠어요?</DialogTitle>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody className="space-y-s-3 pt-2">
            <DialogDescription className="text-foreground-sub text-xs">
              합주를 삭제하면 세션·참여자 정보가 함께 제거되며 복구할 수 없습니다.
            </DialogDescription>
            <Input
              label={`합주 이름(${practice.title})을 그대로 입력해 주세요`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={practice.title}
            />
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => setDeleteOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              disabled={deleteConfirmText !== practice.title}
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
