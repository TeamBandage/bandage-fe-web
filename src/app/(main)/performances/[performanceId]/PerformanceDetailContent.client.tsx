'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  ListPlus,
  Loader2,
  MapPin,
  Music,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { PerformanceDday } from '@/domain/performance/components/PerformanceDday';
import { PerformanceInvitationsPanel } from '@/domain/performance/components/PerformanceInvitationsPanel.client';
import { SetlistSelectorSheet } from '@/domain/performance/components/SetlistSelectorSheet.client';
import { TransferOwnershipPanel } from '@/domain/performance/components/TransferOwnershipPanel.client';
import { useBatchAddPerformanceSetlists } from '@/domain/performance/hooks/useBatchAddPerformanceSetlists';
import { useDeletePerformance } from '@/domain/performance/hooks/useDeletePerformance';
import { useMyPerformanceInvitations } from '@/domain/performance/hooks/useMyPerformanceInvitations';
import { usePerformanceDetail } from '@/domain/performance/hooks/usePerformanceDetail';
import { usePerformanceSetlistTracks } from '@/domain/performance/hooks/usePerformanceSetlistTracks';
import { useRemovePerformanceSetlist } from '@/domain/performance/hooks/useRemovePerformanceSetlist';
import { useUpdatePerformance } from '@/domain/performance/hooks/useUpdatePerformance';
import { updatePerformanceSchema, type UpdatePerformanceSchema } from '@/domain/performance/types';
import {
  createPerformancePoster,
  deletePerformancePoster,
  issuePerformancePosterPresignedUrl,
} from '@/domain/performance-poster/api';
import { usePerformancePosters } from '@/domain/performance-poster/hooks/usePerformancePosters';
import { useUpdatePerformancePoster } from '@/domain/performance-poster/hooks/useUpdatePerformancePoster';
import type { PerformanceSetlistSummary } from '@/domain/performance/types/res';
import type { SetlistTrackResponse } from '@/domain/setlist/types/res';
import { useMySetlists } from '@/domain/setlist/hooks/useMySetlists';
import { useIsPerformanceManager } from '@/global/auth/useIsPerformanceManager';
import { queryKeys } from '@/global/config/queryKeys';
import { ROUTES } from '@/global/config/routes';
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES,
  extFromMime,
  isAllowedImageMime,
} from '@/global/upload/constants';
import { uploadToPresignedUrl } from '@/global/upload/uploadToPresignedUrl';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { formatKst, parseKst } from '@/lib/date';
import { useQueryClient } from '@tanstack/react-query';

function toDatetimeLocal(kst: string) {
  return kst.replace(' ', 'T');
}
function fromDatetimeLocal(dt: string) {
  return dt.replace('T', ' ').slice(0, 16);
}

export function PerformanceDetailContent({
  performanceId,
  onDeleted,
  variant = 'modal',
}: {
  performanceId: string;
  onDeleted?: () => void;
  /** 'page': 데스크톱 전체 화면에서 좌측 큰 포스터 + 우측 컨텐츠 2단 레이아웃으로 표시 */
  variant?: 'modal' | 'page';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const splitLayout = variant === 'page' && isDesktop;
  const posterInputRef = useRef<HTMLInputElement>(null);
  const posterInputId = useId();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'info');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') ?? 'info');
  }, [searchParams]);

  const { data: perf, isLoading, isError, refetch } = usePerformanceDetail(performanceId);
  const { isManager, isOwner } = useIsPerformanceManager(performanceId);
  const { data: posters = [] } = usePerformancePosters(performanceId);
  // 셋리스트별 개별 조회(useSetlistTracks) 대신 공연 단위 일괄 조회 사용 — 공연 OWNER/MANAGER가
  // 본인이 소유·참여하지 않은 셋리스트를 열람하면 예전엔 SETLIST_FORBIDDEN 이 났던 문제를 해결.
  const { data: perfSetlistTracks } = usePerformanceSetlistTracks(performanceId);
  const tracksBySetlistId = new Map(
    (perfSetlistTracks ?? []).map((entry) => [entry.setlist.setlistId, entry.tracks]),
  );
  const { data: myInvitations = [] } = useMyPerformanceInvitations({ enabled: !isManager });
  const hasMyInvitation = myInvitations.some((inv) => inv.performanceId === performanceId);
  const showInvitationsTab = isOwner || (!isManager && hasMyInvitation);

  // OWNER는 모든 셋리스트를, MANAGER는 본인이 소유/참여한 셋리스트만 제거할 수 있다(BE 정책).
  // 권한 판정에는 전체 목록이 필요하므로(화면에 노출되는 리스트가 아님) hasNextPage 인 동안 계속 이어서 가져온다.
  const {
    data: mySetlists,
    fetchNextPage: fetchNextMySetlists,
    hasNextPage: hasNextMySetlists,
    isFetchingNextPage: isFetchingNextMySetlists,
  } = useMySetlists();
  useEffect(() => {
    if (hasNextMySetlists && !isFetchingNextMySetlists) fetchNextMySetlists();
  }, [hasNextMySetlists, isFetchingNextMySetlists, fetchNextMySetlists]);
  const mySetlistIds = new Set(
    (mySetlists?.pages.flatMap((p) => p.content) ?? []).map((s) => s.setlistId),
  );
  const canRemoveSetlist = (setlistId: string) => isOwner || mySetlistIds.has(setlistId);

  const [localPosterPreview, setLocalPosterPreview] = useState<string | null>(null);
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterDescription, setPosterDescription] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [setlistSelectorOpen, setSetlistSelectorOpen] = useState(false);
  const [pendingRemoveSetlist, setPendingRemoveSetlist] =
    useState<PerformanceSetlistSummary | null>(null);

  const editForm = useForm<UpdatePerformanceSchema>({
    resolver: zodResolver(updatePerformanceSchema),
    defaultValues: {
      title: '',
      startAt: '',
      durationMinutes: 120,
      venue: '',
    },
  });

  useEffect(() => {
    if (perf) {
      editForm.reset({
        title: perf.title,
        startAt: toDatetimeLocal(perf.startAt),
        durationMinutes: perf.durationMinutes,
        venue: perf.venue ?? '',
      });
    }
  }, [perf, editForm]);

  const existingPoster = posters[0] ?? null;
  const posterSrc = localPosterPreview ?? existingPoster?.imageUrl ?? null;

  useEffect(() => {
    setPosterDescription(existingPoster?.description ?? '');
  }, [existingPoster]);

  const updatePosterMutation = useUpdatePerformancePoster(
    performanceId,
    existingPoster?.posterId ?? '',
    {
      onSuccess: () => toast.success('포스터 설명을 저장했습니다.'),
      onError: (err) => toast.error(err.message || '저장에 실패했습니다.'),
    },
  );

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
      const presign = await issuePerformancePosterPresignedUrl(performanceId, {
        contentType: file.type,
        contentLength: file.size,
        ext,
      });
      await uploadToPresignedUrl(presign.uploadUrl, file);
      await createPerformancePoster({ performanceId, imageKey: presign.objectKey });
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

  const editMutation = useUpdatePerformance(performanceId, {
    onSuccess: () => toast.success('공연 정보가 수정되었습니다.'),
    onError: (err) => toast.error(err.message || '수정에 실패했습니다.'),
  });

  const deleteMutation = useDeletePerformance(performanceId, {
    onSuccess: () => {
      toast.success('공연을 삭제했습니다.');
      if (onDeleted) {
        onDeleted();
      } else {
        router.replace(ROUTES.PERFORMANCES);
      }
    },
    onError: (err) => toast.error(err.message || '삭제에 실패했습니다.'),
  });

  const addSetlistsMutation = useBatchAddPerformanceSetlists(performanceId, {
    onSuccess: () => toast.success('셋리스트를 추가했습니다.'),
    onError: (err) => toast.error(err.message || '셋리스트 추가에 실패했습니다.'),
  });

  const removeSetlistMutation = useRemovePerformanceSetlist(performanceId, {
    onSuccess: () => toast.success('셋리스트를 제거했습니다.'),
    onError: (err) => toast.error(err.message || '셋리스트 제거에 실패했습니다.'),
  });

  function handleRemoveSetlist() {
    if (!pendingRemoveSetlist) return;
    removeSetlistMutation.mutate(pendingRemoveSetlist.setlistId, {
      onSettled: () => setPendingRemoveSetlist(null),
    });
  }

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
    scheduleLabel = formatKst(parseKst(perf.startAt), 'yyyy년 M월 d일 HH:mm');
  } catch {
    /* keep raw */
  }

  const outerTriggerCls =
    'data-[state=active]:text-foreground data-[state=active]:border-foreground';

  const titleRow = (
    <div className="flex items-center gap-2">
      <h1 className="text-foreground text-[22px] leading-snug font-bold">{perf.title}</h1>
      <PerformanceDday startAt={perf.startAt} />
      {(isOwner || isManager) && (
        <Badge className="ml-auto border border-white/30 bg-white/10 text-white">
          {isOwner ? '소유자' : '매니저'}
        </Badge>
      )}
    </div>
  );

  const posterBox = (
    <div
      className={cn(
        'border-border bg-card relative overflow-hidden rounded-[10px] border',
        splitLayout ? 'aspect-3/4 w-full' : 'mx-auto h-56 w-40 sm:h-80 sm:w-56',
      )}
    >
      {posterSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={posterSrc} alt="공연 포스터" className="h-full w-full object-cover" />
          {posterUploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </>
      ) : (
        <div className="text-foreground-muted gap-s-2 flex h-full flex-col items-center justify-center">
          <ImagePlus className="h-8 w-8" aria-hidden="true" />
          <span className="text-center text-xs">공연 포스터 이미지 없음</span>
        </div>
      )}
    </div>
  );

  const posterDescriptionEl = existingPoster?.description && (
    <p className="text-foreground-muted mt-2 text-center text-xs whitespace-pre-wrap">
      {existingPoster.description}
    </p>
  );

  const tabsSection = (
    <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
      <div className={cn(splitLayout ? 'px-0' : 'px-s-5 lg:px-8')}>
        <TabsList aria-label="공연 상세 탭">
          <TabsTrigger value="info" className={outerTriggerCls}>
            정보
          </TabsTrigger>
          <TabsTrigger value="setlists" className={outerTriggerCls}>
            셋리스트
          </TabsTrigger>
          {showInvitationsTab && (
            <TabsTrigger value="invitations" className={outerTriggerCls}>
              {isOwner ? '매니저 관리' : '초대 요청'}
            </TabsTrigger>
          )}
          {isManager && (
            <TabsTrigger value="settings" className={outerTriggerCls}>
              설정
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className={cn('py-s-6', splitLayout ? 'px-0' : 'px-s-5 lg:px-8')}>
        {/* 정보 탭: 날짜/장소 (포스터는 헤더로 이동) → 셋리스트 */}
        <TabsContent value="info" className="space-y-s-4 mt-0">
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
        </TabsContent>

        {/* 셋리스트 탭 */}
        <TabsContent value="setlists" className="space-y-s-3 mt-0">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-base font-semibold">참여 셋리스트</p>
            {isManager && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 rounded-[5px] px-2"
                onClick={() => setSetlistSelectorOpen(true)}
              >
                <ListPlus className="h-4 w-4" aria-hidden="true" />
                추가
              </Button>
            )}
          </div>

          {perf.setlists.length === 0 ? (
            <EmptyState title="연결된 셋리스트가 없습니다" compact />
          ) : (
            <div className="space-y-s-2">
              {perf.setlists.map((s) => (
                <div key={s.setlistId} className="flex items-center gap-2">
                  <SetlistCard setlist={s} tracks={tracksBySetlistId.get(s.setlistId) ?? []} />
                  {isManager &&
                    (canRemoveSetlist(s.setlistId) ? (
                      <button
                        type="button"
                        onClick={() => setPendingRemoveSetlist(s)}
                        aria-label={`${s.title} 셋리스트 제거`}
                        className="text-foreground-muted hover:text-danger shrink-0 rounded p-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="invisible shrink-0 rounded p-1" aria-hidden="true">
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    ))}
                </div>
              ))}
            </div>
          )}

          <SetlistSelectorSheet
            open={setlistSelectorOpen}
            onOpenChange={setSetlistSelectorOpen}
            excludeIds={perf.setlists.map((s) => s.setlistId)}
            onConfirm={(selected) => {
              if (selected.length === 0) return;
              addSetlistsMutation.mutate({
                setlistIds: selected.map((s) => s.setlistId),
              });
            }}
          />

          <Dialog
            open={pendingRemoveSetlist !== null}
            onOpenChange={(o) => {
              if (!o) setPendingRemoveSetlist(null);
            }}
          >
            <DialogContent srOnlyTitle="셋리스트 제거">
              <DialogHeader className="border-b-0 pb-2">
                <DialogTitle>셋리스트를 제거하시겠어요?</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <p className="text-foreground-sub text-sm">
                  <strong className="text-foreground">{pendingRemoveSetlist?.title}</strong>{' '}
                  셋리스트를 공연에서 제거합니다.
                </p>
              </DialogBody>
              <DialogFooter className="border-t-0">
                <Button
                  variant="ghost"
                  className="h-8 rounded-[5px]"
                  onClick={() => setPendingRemoveSetlist(null)}
                >
                  취소
                </Button>
                <Button
                  variant="danger"
                  className="h-8 rounded-[5px] px-2"
                  loading={removeSetlistMutation.isPending}
                  onClick={handleRemoveSetlist}
                >
                  제거
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 매니저 관리(owner)/초대 요청(미배정 초대 수신자) 탭. 매니저는 노출하지 않음 */}
        {showInvitationsTab && (
          <TabsContent value="invitations" className="mt-0">
            {isOwner ? (
              <Tabs defaultValue="invite-managers">
                <TabsList className="mb-s-4 w-full">
                  <TabsTrigger
                    value="invite-managers"
                    className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                  >
                    매니저 초대
                  </TabsTrigger>
                  <TabsTrigger
                    value="transfer-ownership"
                    className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                  >
                    공연 소유권 양도
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="invite-managers" className="mt-0">
                  <PerformanceInvitationsPanel performanceId={performanceId} isOwner={isOwner} />
                </TabsContent>

                <TabsContent value="transfer-ownership" className="mt-0">
                  <TransferOwnershipPanel
                    performanceId={performanceId}
                    managerIds={perf.managerIds}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <PerformanceInvitationsPanel performanceId={performanceId} isOwner={isOwner} />
            )}
          </TabsContent>
        )}

        {/* 설정 탭 (매니저 전용) */}
        {isManager && (
          <TabsContent value="settings" className="mt-0">
            <Tabs defaultValue="edit-info">
              <TabsList className="mb-s-4 w-full">
                <TabsTrigger
                  value="edit-info"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                >
                  정보
                </TabsTrigger>
                <TabsTrigger
                  value="edit-poster"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                >
                  포스터
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger
                    value="delete"
                    className="flex-1 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
                  >
                    삭제
                  </TabsTrigger>
                )}
              </TabsList>

              {/* 정보 수정 */}
              <TabsContent value="edit-info" className="mt-0">
                <form
                  onSubmit={editForm.handleSubmit((values) =>
                    editMutation.mutate({
                      title: values.title,
                      startAt: values.startAt ? fromDatetimeLocal(values.startAt) : undefined,
                      durationMinutes: values.durationMinutes,
                      venue: values.venue,
                    }),
                  )}
                  noValidate
                  className="space-y-3"
                >
                  <Input
                    label="제목"
                    error={editForm.formState.errors.title?.message}
                    {...editForm.register('title')}
                  />
                  <Input
                    label="시작 시각"
                    type="datetime-local"
                    error={editForm.formState.errors.startAt?.message}
                    className="[&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert"
                    {...editForm.register('startAt')}
                  />
                  <Input
                    label="소요 시간 (분)"
                    type="number"
                    min={30}
                    max={600}
                    step={10}
                    error={editForm.formState.errors.durationMinutes?.message}
                    {...editForm.register('durationMinutes', { valueAsNumber: true })}
                  />
                  <Input
                    label="장소"
                    error={editForm.formState.errors.venue?.message}
                    {...editForm.register('venue')}
                  />
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      loading={editMutation.isPending}
                      className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200"
                    >
                      저장
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* 포스터 수정 */}
              <TabsContent value="edit-poster" className="mt-0">
                {posterSrc ? (
                  <div className="space-y-s-3">
                    <div className="relative mx-auto w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={posterSrc}
                        alt="공연 포스터"
                        className="max-h-72 rounded-[5px] object-contain"
                      />
                      {!posterUploading && (
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
                    {!posterUploading && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => posterInputRef.current?.click()}
                          className="text-foreground-sub text-caption hover:text-foreground underline"
                        >
                          다른 이미지로 변경
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor={posterInputId}
                    className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-[5px] border border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40 hover:bg-white/10"
                  >
                    <ImagePlus className="h-8 w-8 text-white/50" />
                    <span className="text-sm font-medium text-white/60">
                      클릭하여 포스터 이미지 선택
                    </span>
                    <span className="text-xs text-white/40">JPEG · PNG · WEBP · 최대 5MB</span>
                  </label>
                )}
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
                {existingPoster && (
                  <div className="mt-s-4 flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="포스터 설명 (선택)"
                        placeholder="공연 포스터에 대한 설명을 입력하세요"
                        value={posterDescription}
                        onChange={(e) => setPosterDescription(e.target.value.slice(0, 50))}
                        maxLength={50}
                        hint={`${posterDescription.length}/50자`}
                      />
                    </div>
                    <Button
                      size="md"
                      className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200"
                      loading={updatePosterMutation.isPending}
                      onClick={() =>
                        updatePosterMutation.mutate({ description: posterDescription })
                      }
                    >
                      저장
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* 삭제 (OWNER 전용) */}
              {isOwner && (
                <TabsContent value="delete" className="mt-0">
                  <div className="space-y-s-3">
                    <p className="text-foreground-sub text-xs">
                      공연을 삭제하면 모든 포스터·셋리스트 연결이 함께 제거되며 복구할 수 없습니다.
                    </p>
                    <Input
                      label={`공연 이름(${perf.title})을 그대로 입력해 주세요`}
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={perf.title}
                    />
                  </div>
                  <div className="mt-s-4 flex justify-end">
                    <Button
                      variant="danger"
                      size="sm"
                      className="rounded-[5px]"
                      disabled={deleteConfirmText !== perf.title}
                      loading={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate()}
                    >
                      삭제
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>
        )}
      </div>
    </Tabs>
  );

  return (
    <div>
      {splitLayout ? (
        <div className="flex items-start gap-8 px-8 py-7">
          <div className="w-[360px] shrink-0">
            {posterBox}
            {posterDescriptionEl}
          </div>
          <div className="min-w-0 flex-1">
            <div className="pb-s-3">{titleRow}</div>
            {tabsSection}
          </div>
        </div>
      ) : (
        <>
          <div className="px-s-5 pb-s-3 pt-s-4 lg:px-8">
            {titleRow}
            <div className="mt-s-3">{posterBox}</div>
            {posterDescriptionEl}
          </div>
          {tabsSection}
        </>
      )}
    </div>
  );
}

function SetlistCard({
  setlist,
  tracks,
}: {
  setlist: PerformanceSetlistSummary;
  tracks: SetlistTrackResponse[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-border min-w-0 flex-1 overflow-hidden rounded-[5px] border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-surface-hi flex w-full items-center justify-between px-3 py-2 transition-colors"
        aria-expanded={open}
      >
        <span className="text-foreground text-sm font-semibold">{setlist.title}</span>
        {open ? (
          <ChevronUp className="text-foreground-muted h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="text-foreground-muted h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      {open &&
        (tracks.length === 0 ? (
          <p className="text-foreground-muted border-border border-t px-3 py-2 text-xs">
            트랙이 없습니다.
          </p>
        ) : (
          <ul className="border-border border-t">
            {tracks.map((track) => (
              <li
                key={track.setlistTrackId}
                className="border-border flex items-center gap-2 border-b px-3 py-2 last:border-0"
              >
                <Music className="text-foreground-muted h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="text-foreground text-sm">{track.title}</span>
                {track.artist && (
                  <span className="text-foreground-muted text-xs">— {track.artist}</span>
                )}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
