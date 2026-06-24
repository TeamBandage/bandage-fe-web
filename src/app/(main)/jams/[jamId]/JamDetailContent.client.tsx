'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, MapPin, Music, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
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
import { useAddParticipant } from '@/domain/jam/hooks/useAddParticipant';
import { useDeleteJam } from '@/domain/jam/hooks/useDeleteJam';
import { useJam } from '@/domain/jam/hooks/useJam';
import { useUpdateParticipantSession } from '@/domain/jam/hooks/useUpdateParticipantSession';
import { useUpdateSchedule } from '@/domain/jam/hooks/useUpdateSchedule';
import { useUpdateVenue } from '@/domain/jam/hooks/useUpdateVenue';
import { addParticipantSchema, type AddParticipantSchema } from '@/domain/jam/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

function toDatetimeLocal(kst: string) {
  // "yyyy-MM-dd HH:mm" -> "YYYY-MM-DDTHH:mm"
  return kst.replace(' ', 'T');
}
function fromDatetimeLocal(dt: string) {
  return dt.replace('T', ' ').slice(0, 16);
}

export function JamDetailContent({
  jamId,
  onAfterDelete,
}: {
  jamId: string;
  onAfterDelete?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { data: practice, isLoading, isError, refetch } = useJam(jamId);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    memberId: number;
  } | null>(null);
  const [assignSessionId, setAssignSessionId] = useState('');

  const addParticipantForm = useForm<AddParticipantSchema>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: { memberId: undefined as unknown as number, sessionId: '' },
  });
  const addParticipantMutation = useAddParticipant(jamId, {
    onSuccess: () => {
      toast.success('참여자가 추가되었습니다.');
      addParticipantForm.reset({ memberId: undefined as unknown as number, sessionId: '' });
    },
    onError: (err) => toast.error(err.message || '참여자 추가에 실패했습니다.'),
  });

  const updateSessionMutation = useUpdateParticipantSession(jamId, {
    onSuccess: () => {
      toast.success('세션이 배정되었습니다.');
      setSessionAssignTarget(null);
      setAssignSessionId('');
    },
    onError: (err) => toast.error(err.message || '세션 배정에 실패했습니다.'),
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
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-foreground text-xl font-bold">{practice.title}</h1>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              합주 삭제
            </Button>
          </div>

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

      <Tabs defaultValue="song">
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
                    className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert"
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
                    className="h-8 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
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
                    className="h-8 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
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
              <div className="flex items-center gap-2">
                <Music className="text-foreground-muted h-4 w-4" aria-hidden="true" />
                <span className="text-foreground text-sm font-medium">
                  {practice.track.title} — {practice.track.artist}
                </span>
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
          <Card header="세션 편성" padding="md">
            <div className="space-y-4">
              <SessionCreateForm jamId={jamId} />
              {practice.sessions.length === 0 ? (
                <EmptyState title="등록된 세션이 없습니다" />
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
          <Card header="참여자" padding="md">
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
                  <span className="text-foreground text-xs font-medium">멤버 ID</span>
                  <span className="text-foreground text-xs font-medium">세션 선택</span>
                  <span />
                  <Input
                    type="number"
                    min={1}
                    className="[appearance:textfield] rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    {...addParticipantForm.register('memberId', { valueAsNumber: true })}
                  />
                  <Select
                    placeholder="세션을 선택하세요"
                    options={practice.sessions
                      .filter((s) => s.participants.length < s.need)
                      .map((s) => ({
                        value: s.sessionId,
                        label: `${s.short} · ${s.label}`,
                      }))}
                    className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
                    disabled={
                      practice.sessions.filter((s) => s.participants.length < s.need).length === 0
                    }
                    {...addParticipantForm.register('sessionId')}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-8 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
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
                <EmptyState title="참여자가 없습니다" />
              ) : (
                <ul className="divide-border divide-y">
                  {practice.participants.map((p) => {
                    const session = practice.sessions.find((s) => s.sessionId === p.sessionId);
                    return (
                      <li
                        key={p.participantId}
                        className="py-s-2 flex items-center justify-between gap-3"
                      >
                        <span className="text-foreground-sub text-sm">
                          멤버 {p.memberId}
                          {session && (
                            <span className="text-foreground-muted ml-2">· {session.label}</span>
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSessionAssignTarget({
                              participantId: p.participantId,
                              memberId: p.memberId,
                            });
                            setAssignSessionId(p.sessionId ?? '');
                          }}
                        >
                          {p.sessionId ? '세션 변경' : '세션 배정'}
                        </Button>
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
          if (!open) {
            setSessionAssignTarget(null);
            setAssignSessionId('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세션 배정</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <p className="text-foreground-muted text-sm">
                멤버 {sessionAssignTarget?.memberId}에게 세션을 배정합니다.
              </p>
              <Select
                placeholder="세션을 선택하세요"
                value={assignSessionId}
                onChange={(e) => setAssignSessionId(e.target.value)}
                options={(() => {
                  const mySessionId = practice.participants.find(
                    (p) => p.participantId === sessionAssignTarget?.participantId,
                  )?.sessionId;
                  return practice.sessions
                    .filter((s) => s.participants.length < s.need || s.sessionId === mySessionId)
                    .map((s) => ({ value: s.sessionId, label: `${s.short} · ${s.label}` }));
                })()}
                className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => {
                setSessionAssignTarget(null);
                setAssignSessionId('');
              }}
            >
              취소
            </Button>
            <Button
              variant="secondary"
              className="h-8 rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
              disabled={!assignSessionId}
              loading={updateSessionMutation.isPending}
              onClick={() => {
                if (!sessionAssignTarget || !assignSessionId) return;
                updateSessionMutation.mutate({
                  participantId: sessionAssignTarget.participantId,
                  req: { sessionId: assignSessionId },
                });
              }}
            >
              배정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>합주를 삭제하시겠어요?</DialogTitle>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody className="pt-2">
            <DialogDescription className="text-foreground-sub text-sm">
              삭제된 합주는 복구할 수 없습니다. 세션과 참여자 정보도 함께 제거됩니다.
            </DialogDescription>
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
