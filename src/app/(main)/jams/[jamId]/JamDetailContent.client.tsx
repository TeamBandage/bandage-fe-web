'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Music, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ExternalLink } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JamScheduleBadge } from '@/domain/jam/components/JamScheduleBadge';
import { JamVenueInline } from '@/domain/jam/components/JamVenueInline.client';
import { SessionCreateForm } from '@/domain/jam/components/SessionCreateForm.client';
import { SessionRow } from '@/domain/jam/components/SessionRow';
import { useAddParticipant } from '@/domain/jam/hooks/useAddParticipant';
import { useDeleteJam } from '@/domain/jam/hooks/useDeleteJam';
import { useJam } from '@/domain/jam/hooks/useJam';
import { useUpdateSchedule } from '@/domain/jam/hooks/useUpdateSchedule';
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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const scheduleForm = useForm<{ startAt: string; durationMinutes: number }>({
    defaultValues: { startAt: '', durationMinutes: 60 },
  });

  const updateScheduleMutation = useUpdateSchedule(jamId, {
    onSuccess: () => {
      toast.success('일정이 변경되었습니다.');
      setScheduleOpen(false);
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

  const addParticipantForm = useForm<AddParticipantSchema>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: { memberId: undefined as unknown as number, sessionId: '' },
  });
  const addParticipantMutation = useAddParticipant(jamId, {
    onSuccess: () => {
      toast.success('참여자가 추가되었습니다.');
      addParticipantForm.reset({ memberId: undefined as unknown as number });
    },
    onError: (err) => toast.error(err.message || '참여자 추가에 실패했습니다.'),
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
              variant="ghost"
              className="text-danger hover:opacity-80"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <JamScheduleBadge
              startAt={practice.startAt}
              durationMinutes={practice.durationMinutes}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                scheduleForm.reset({
                  startAt: toDatetimeLocal(practice.startAt),
                  durationMinutes: practice.durationMinutes,
                });
                setScheduleOpen(true);
              }}
            >
              일정 변경
            </Button>
          </div>
          <JamVenueInline jamId={jamId} venue={practice.venue} />
        </div>
      </Card>

      <Tabs defaultValue="song">
        <TabsList>
          <TabsTrigger value="song">곡</TabsTrigger>
          <TabsTrigger value="sessions">세션</TabsTrigger>
          <TabsTrigger value="participants">참여자</TabsTrigger>
        </TabsList>

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
                className="flex flex-wrap items-end gap-2"
                onSubmit={addParticipantForm.handleSubmit((values) =>
                  addParticipantMutation.mutate(values),
                )}
                noValidate
              >
                <Input
                  label="멤버 ID"
                  type="number"
                  placeholder="예: 3"
                  className="max-w-xs"
                  error={addParticipantForm.formState.errors.memberId?.message}
                  {...addParticipantForm.register('memberId', { valueAsNumber: true })}
                />
                <Input
                  label="세션 ID"
                  placeholder="예: GUITAR"
                  className="max-w-xs"
                  error={addParticipantForm.formState.errors.sessionId?.message}
                  {...addParticipantForm.register('sessionId')}
                />
                <Button type="submit" loading={addParticipantMutation.isPending}>
                  <UserPlus className="h-4 w-4" />
                  추가
                </Button>
              </form>
              {practice.participants.length === 0 ? (
                <EmptyState title="참여자가 없습니다" />
              ) : (
                <ul className="space-y-2">
                  {practice.participants.map((p) => (
                    <li key={p.participantId} className="text-foreground-sub text-sm">
                      멤버 {p.memberId} · {p.sessionId}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일정 변경</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={scheduleForm.handleSubmit((values) =>
              updateScheduleMutation.mutate({
                startAt: fromDatetimeLocal(values.startAt),
                durationMinutes: Number(values.durationMinutes),
              }),
            )}
          >
            <DialogBody>
              <div className="space-y-3">
                <Input
                  label="시작 시각"
                  type="datetime-local"
                  {...scheduleForm.register('startAt')}
                />
                <Input
                  label="소요 시간 (분)"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  {...scheduleForm.register('durationMinutes', { valueAsNumber: true })}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setScheduleOpen(false)}>
                취소
              </Button>
              <Button type="submit" loading={updateScheduleMutation.isPending}>
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>합주 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              삭제된 합주는 복구할 수 없습니다. 세션과 참여자 정보도 함께 제거됩니다.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
