'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  ImagePlus,
  ListMusic,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
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
import {
  createPerformancePoster,
  deletePerformancePoster,
  issuePerformancePosterPresignedUrl,
} from '@/domain/performance-poster/api';
import { usePerformancePosters } from '@/domain/performance-poster/hooks/usePerformancePosters';
import { useIsPerformanceManager } from '@/global/auth/useIsPerformanceManager';
import { ROUTES } from '@/global/config/routes';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/global/config/queryKeys';
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES,
  extFromMime,
  isAllowedImageMime,
} from '@/global/upload/constants';
import { uploadToPresignedUrl } from '@/global/upload/uploadToPresignedUrl';
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
  const queryClient = useQueryClient();
  const posterInputRef = useRef<HTMLInputElement>(null);
  const posterInputId = useId();

  const { data: perf, isLoading, isError, refetch } = usePerformanceDetail(performanceId);
  const { isManager } = useIsPerformanceManager(performanceId);
  const { data: posters = [] } = usePerformancePosters(performanceId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [localPosterPreview, setLocalPosterPreview] = useState<string | null>(null);
  const [posterUploading, setPosterUploading] = useState(false);

  const existingPoster = posters[0] ?? null;
  const posterSrc = localPosterPreview ?? existingPoster?.imageUrl ?? null;

  async function handlePosterFile(file: File) {
    if (!isAllowedImageMime(file.type)) {
      toast.error('JPEG / PNG / WEBP 형식만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    if (localPosterPreview) URL.revokeObjectURL(localPosterPreview);
    setLocalPosterPreview(URL.createObjectURL(file));
    setPosterUploading(true);
    try {
      const ext = extFromMime(file.type);
      if (!ext) throw new Error('지원하지 않는 이미지 형식입니다.');
      const presign = await issuePerformancePosterPresignedUrl({
        contentType: file.type,
        contentLength: file.size,
        ext,
      });
      await uploadToPresignedUrl(presign.uploadUrl, file);
      await createPerformancePoster({ performanceId, objectKey: presign.objectKey });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.performancePoster.list(performanceId),
      });
      toast.success('포스터를 등록했습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '포스터 업로드에 실패했습니다.';
      toast.error(message);
      setLocalPosterPreview(null);
    } finally {
      setPosterUploading(false);
    }
  }

  async function handleDeletePoster() {
    if (!existingPoster) return;
    try {
      await deletePerformancePoster(existingPoster.posterId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.performancePoster.list(performanceId),
      });
      if (localPosterPreview) URL.revokeObjectURL(localPosterPreview);
      setLocalPosterPreview(null);
      toast.success('포스터를 삭제했습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '포스터 삭제에 실패했습니다.';
      toast.error(message);
    }
  }

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

      {/* 포스터 카드 */}
      <Card
        header={
          <span className="inline-flex items-center gap-2">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            공연 포스터
          </span>
        }
        padding="md"
      >
        {posterSrc ? (
          <div className="space-y-s-3">
            <div className="relative mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterSrc}
                alt="공연 포스터"
                className="max-h-72 rounded-[5px] object-contain"
              />
              {isManager && !posterUploading && (
                <button
                  type="button"
                  aria-label="포스터 삭제"
                  onClick={handleDeletePoster}
                  className="bg-surface border-border absolute -top-2 -right-2 rounded-full border p-0.5 text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {posterUploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-[5px] bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </span>
              )}
            </div>
            {isManager && !posterUploading && (
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                className="text-foreground-sub text-caption hover:text-foreground underline"
              >
                다른 이미지로 변경
              </button>
            )}
          </div>
        ) : isManager ? (
          <label
            htmlFor={posterInputId}
            className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-[5px] border border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40 hover:bg-white/10"
          >
            <ImagePlus className="h-8 w-8 text-white/50" />
            <span className="text-sm font-medium text-white/60">클릭하여 포스터 이미지 선택</span>
            <span className="text-xs text-white/40">JPEG · PNG · WEBP · 최대 5MB</span>
          </label>
        ) : (
          <p className="text-foreground-muted text-caption py-4 text-center">
            등록된 포스터가 없습니다.
          </p>
        )}
        {isManager && (
          <input
            ref={posterInputRef}
            id={posterInputId}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handlePosterFile(file);
            }}
          />
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
