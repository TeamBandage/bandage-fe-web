'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Link2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';
import { PerformanceBandChips } from '@/domain/performance/components/PerformanceBandChips';
import { PerformanceDday } from '@/domain/performance/components/PerformanceDday';
import { PerformancePracticeRow } from '@/domain/performance/components/PerformancePracticeRow';
import { useAddPerformancePractice } from '@/domain/performance/hooks/useAddPerformancePractice';
import { useBatchAddPerformancePractices } from '@/domain/performance/hooks/useBatchAddPerformancePractices';
import { useDeletePerformance } from '@/domain/performance/hooks/useDeletePerformance';
import { usePerformanceDetail } from '@/domain/performance/hooks/usePerformanceDetail';
import { useUpdatePerformance } from '@/domain/performance/hooks/useUpdatePerformance';
import {
  addPerformancePracticeSchema,
  updatePerformanceSchema,
  type AddPerformancePracticeSchema,
  type UpdatePerformanceSchema,
} from '@/domain/performance/types';
import { BandPickerModal } from '@/domain/band/components/BandPickerModal.client';
import { useIsPerformanceManager } from '@/global/auth/useIsPerformanceManager';
import { ROUTES } from '@/global/config/routes';
import { formatKst, parseKst } from '@/lib/date';
import { useToast } from '@/hooks/useToast';

function toDatetimeLocal(kst: string) {
  return kst.replace(' ', 'T');
}
function fromDatetimeLocal(dt: string) {
  return dt.replace('T', ' ').slice(0, 16);
}

export function PerformanceDetailContent({ performanceId }: { performanceId: string }) {
  const router = useRouter();
  const toast = useToast();

  const { data: perf, isLoading, isError, refetch } = usePerformanceDetail(performanceId);
  const { isManager } = useIsPerformanceManager(performanceId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [bandPickerOpen, setBandPickerOpen] = useState(false);

  const deleteMutation = useDeletePerformance(performanceId, {
    onSuccess: () => {
      toast.success('공연을 삭제했습니다.');
      router.replace(ROUTES.PERFORMANCES);
    },
    onError: (err) => toast.error(err.message || '삭제에 실패했습니다.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" rounded="lg" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );
  }

  if (isError || !perf) {
    return <ErrorState title="공연을 찾을 수 없습니다" onRetry={() => refetch()} />;
  }

  let scheduleLabel = perf.startAt;
  try {
    scheduleLabel = formatKst(parseKst(perf.startAt), 'yyyy년 M월 d일 (EEE) HH:mm');
  } catch {
    /* keep raw */
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-foreground text-xl font-bold">{perf.title}</h1>
              <PerformanceDday startAt={perf.startAt} />
            </div>
            {isManager && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:opacity-80"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-foreground-sub flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {scheduleLabel} ({perf.durationMinutes}분)
            </span>
            {perf.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {perf.venue}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="bands">
        <TabsList>
          <TabsTrigger value="bands">참여 밴드</TabsTrigger>
          <TabsTrigger value="practices">연결 합주 ({perf.practiceIds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bands">
          <Card
            header={
              <div className="flex items-center justify-between">
                <span>참여 밴드 ({perf.bandIds.length})</span>
                {isManager && (
                  <Button size="sm" onClick={() => setBandPickerOpen(true)}>
                    <Plus className="h-4 w-4" />
                    참여 밴드 추가
                  </Button>
                )}
              </div>
            }
            padding="md"
          >
            <PerformanceBandChips bandIds={perf.bandIds} />
          </Card>
        </TabsContent>

        <TabsContent value="practices">
          <Card
            header={
              <div className="flex items-center justify-between">
                <span>연결된 합주 ({perf.practiceIds.length})</span>
                {isManager && (
                  <Button size="sm" onClick={() => setAttachOpen(true)}>
                    <Plus className="h-4 w-4" />
                    합주 연결
                  </Button>
                )}
              </div>
            }
            padding="md"
          >
            {perf.practiceIds.length === 0 ? (
              <EmptyState title="연결된 합주가 없습니다" />
            ) : (
              <div>
                {perf.practiceIds.map((pid) => (
                  <PerformancePracticeRow
                    key={pid}
                    performanceId={performanceId}
                    practiceId={pid}
                  />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        performanceId={performanceId}
        initial={{
          title: perf.title,
          startAt: perf.startAt,
          durationMinutes: perf.durationMinutes,
          venue: perf.venue ?? undefined,
        }}
      />

      <AttachDialog open={attachOpen} onOpenChange={setAttachOpen} performanceId={performanceId} />

      <BandPickerModal
        open={bandPickerOpen}
        onOpenChange={setBandPickerOpen}
        multiple
        title="참여 밴드 추가"
        onConfirm={(bands) => {
          // FE-API-017 — 백엔드에 POST /performances/{id}/bands/batch 엔드포인트가
          // 추가될 때까지 mock toast 로 안내. 본 라운드 UI 검증용.
          toast.info(
            `${bands.length}개 밴드를 선택했습니다 — 백엔드 연동(FE-API-017) 후 자동 반영됩니다.`,
          );
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공연 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              삭제된 공연은 복구할 수 없으며, 신규 생성으로 연결된 합주도 함께 제거됩니다.
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

function EditDialog({
  open,
  onOpenChange,
  performanceId,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  performanceId: string;
  initial: {
    title: string;
    startAt: string;
    durationMinutes: number;
    venue?: string;
  };
}) {
  const toast = useToast();
  const form = useForm<UpdatePerformanceSchema>({
    resolver: zodResolver(updatePerformanceSchema),
    defaultValues: {
      title: initial.title,
      startAt: initial.startAt,
      durationMinutes: initial.durationMinutes,
      venue: initial.venue,
    },
  });

  const mutation = useUpdatePerformance(performanceId, {
    onSuccess: () => {
      toast.success('공연 정보가 수정되었습니다.');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '수정에 실패했습니다.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>공연 수정</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate({
              title: values.title,
              startAt: values.startAt ? fromDatetimeLocal(values.startAt) : undefined,
              durationMinutes: values.durationMinutes,
              venue: values.venue,
            }),
          )}
          noValidate
        >
          <DialogBody>
            <div className="space-y-3">
              <Input
                label="제목"
                error={form.formState.errors.title?.message}
                {...form.register('title')}
              />
              <Input
                label="시작 시각"
                type="datetime-local"
                defaultValue={toDatetimeLocal(initial.startAt)}
                error={form.formState.errors.startAt?.message}
                {...form.register('startAt')}
              />
              <Input
                label="소요 시간 (분)"
                type="number"
                min={30}
                max={600}
                step={30}
                error={form.formState.errors.durationMinutes?.message}
                {...form.register('durationMinutes', { valueAsNumber: true })}
              />
              <Input
                label="장소"
                error={form.formState.errors.venue?.message}
                {...form.register('venue')}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AttachDialog({
  open,
  onOpenChange,
  performanceId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  performanceId: string;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<'batch' | 'new'>('batch');
  const [practiceIdsRaw, setPracticeIdsRaw] = useState('');

  const batchMutation = useBatchAddPerformancePractices(performanceId, {
    onSuccess: () => {
      toast.success('합주를 일괄 연결했습니다.');
      setPracticeIdsRaw('');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '합주 연결에 실패했습니다.'),
  });

  const newForm = useForm<AddPerformancePracticeSchema>({
    resolver: zodResolver(addPerformancePracticeSchema),
    defaultValues: {
      title: '',
      songId: '',
      startAt: '',
      durationMinutes: 60,
      venue: '',
    },
  });

  const newMutation = useAddPerformancePractice(performanceId, {
    onSuccess: () => {
      toast.success('합주를 생성하고 연결했습니다.');
      newForm.reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '합주 생성에 실패했습니다.'),
  });

  const attachExisting = () => {
    const ids = practiceIdsRaw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      toast.warn('최소 1개 이상의 practiceId 를 입력해 주세요.');
      return;
    }
    batchMutation.mutate({ practiceIds: ids });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Link2 className="mr-1 inline h-4 w-4" />
            합주 연결
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'batch' | 'new')}>
            <TabsList>
              <TabsTrigger value="batch">기존 합주 연결</TabsTrigger>
              <TabsTrigger value="new">신규 합주 생성</TabsTrigger>
            </TabsList>
            <TabsContent value="batch">
              <div className="space-y-3">
                <Textarea
                  label="Practice ID 목록"
                  placeholder="practiceId 를 쉼표 또는 줄바꿈으로 구분해 입력"
                  hint="기존에 생성된 합주 UUID 를 붙여넣습니다. 백엔드 합주 검색 UI 도입 시 드롭다운으로 교체 예정."
                  value={practiceIdsRaw}
                  onChange={(e) => setPracticeIdsRaw(e.target.value)}
                />
                <Button onClick={attachExisting} loading={batchMutation.isPending}>
                  일괄 연결
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="new">
              <form
                className="space-y-3"
                onSubmit={newForm.handleSubmit((values) =>
                  newMutation.mutate({
                    title: values.title,
                    songId: values.songId,
                    startAt: fromDatetimeLocal(values.startAt),
                    durationMinutes: values.durationMinutes,
                    venue: values.venue,
                  }),
                )}
                noValidate
              >
                <Input
                  label="제목 (선택)"
                  error={newForm.formState.errors.title?.message}
                  {...newForm.register('title')}
                />
                <Input
                  label="합주곡 ID"
                  placeholder="songId (UUID)"
                  required
                  error={newForm.formState.errors.songId?.message}
                  {...newForm.register('songId')}
                />
                <Input
                  label="시작 시각"
                  type="datetime-local"
                  required
                  error={newForm.formState.errors.startAt?.message}
                  {...newForm.register('startAt')}
                />
                <Input
                  label="소요 시간 (분)"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  required
                  error={newForm.formState.errors.durationMinutes?.message}
                  {...newForm.register('durationMinutes', { valueAsNumber: true })}
                />
                <Input
                  label="장소 (선택)"
                  error={newForm.formState.errors.venue?.message}
                  {...newForm.register('venue')}
                />
                <Button type="submit" loading={newMutation.isPending}>
                  생성 + 연결
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
