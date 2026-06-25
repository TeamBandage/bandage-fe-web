'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, ListMusic, MapPin, Pencil, Trash2 } from 'lucide-react';
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
import { PerformanceBandChips } from '@/domain/performance/components/PerformanceBandChips';
import { PerformanceDday } from '@/domain/performance/components/PerformanceDday';
import { useDeletePerformance } from '@/domain/performance/hooks/useDeletePerformance';
import { usePerformanceDetail } from '@/domain/performance/hooks/usePerformanceDetail';
import { useUpdatePerformance } from '@/domain/performance/hooks/useUpdatePerformance';
import { updatePerformanceSchema, type UpdatePerformanceSchema } from '@/domain/performance/types';
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

      <Card
        header={
          <span className="inline-flex items-center gap-2">
            <ListMusic className="h-4 w-4" aria-hidden="true" />
            참여 셋리스트 ({perf.setlists.length})
          </span>
        }
        padding="md"
      >
        {perf.setlists.length === 0 ? (
          <EmptyState title="연결된 셋리스트가 없습니다" />
        ) : (
          <ul className="divide-border divide-y">
            {perf.setlists.map((s) => (
              <li key={s.setlistId} className="py-s-3 space-y-1">
                <p className="text-body font-semibold">{s.title}</p>
                {s.bands.length > 0 && <PerformanceBandChips bands={s.bands} />}
              </li>
            ))}
          </ul>
        )}
      </Card>

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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공연 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">삭제된 공연은 복구할 수 없습니다.</p>
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
                step={10}
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
