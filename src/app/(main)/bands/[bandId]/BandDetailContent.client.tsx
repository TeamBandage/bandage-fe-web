'use client';

import { ImagePlus, Loader2, LogOut, UserMinus, UserPlus, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES,
  isAllowedImageMime,
} from '@/global/upload/constants';
import { uploadProfileImage } from '@/global/upload/uploadProfileImage';
import { BandApplicationRow } from '@/domain/band/components/BandApplicationRow';
import { BandMemberRow } from '@/domain/band/components/BandMemberRow';
import { useApplyBand } from '@/domain/band/hooks/useApplyBand';
import { useBandApplications } from '@/domain/band/hooks/useBandApplications';
import { useMyApplicationForBand } from '@/domain/band/hooks/useMyApplicationForBand';
import { useWithdrawApplication } from '@/domain/band/hooks/useWithdrawApplication';
import { useBandDetail } from '@/domain/band/hooks/useBandDetail';
import { useBandMembers } from '@/domain/band/hooks/useBandMembers';
import { useDeleteBand } from '@/domain/band/hooks/useDeleteBand';
import { useDeleteBandProfileImage } from '@/domain/band/hooks/useDeleteBandProfileImage';
import { useLeaveBand } from '@/domain/band/hooks/useLeaveBand';
import { useUpdateBand } from '@/domain/band/hooks/useUpdateBand';
import { hasRole } from '@/global/auth/RoleGuard';
import { useBandRole } from '@/global/auth/useBandRole';
import { ROUTES } from '@/global/config/routes';
import type { ApplicationStatus } from '@/global/types';
import { useToast } from '@/hooks/useToast';

/**
 * 밴드 상세. handoff/band-detail.md (TopBar 72px / Tab bar 48px / content 24/32 padding) 스펙 일치.
 */
export function BandDetailContent({ bandId }: { bandId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'info');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') ?? 'info');
  }, [searchParams]);

  const { data: band, isLoading, isError, refetch } = useBandDetail(bandId);
  const { data: myRole } = useBandRole(bandId);

  const applyMutation = useApplyBand(bandId, {
    onSuccess: () => toast.success('가입 신청을 보냈습니다. 승인을 기다려 주세요.'),
    onError: (err) => toast.error(err.message || '가입 신청에 실패했습니다.'),
  });

  const { data: myApplication } = useMyApplicationForBand(bandId);

  const withdrawMutation = useWithdrawApplication(bandId, {
    onSuccess: () => toast.success('가입 신청을 철회했습니다.'),
    onError: (err) => toast.error(err.message || '가입 신청 철회에 실패했습니다.'),
  });

  const leaveMutation = useLeaveBand(bandId, {
    onSuccess: () => {
      toast.success('밴드에서 탈퇴했습니다.');
      router.replace(ROUTES.BANDS);
    },
    onError: (err) => toast.error(err.message || '탈퇴에 실패했습니다.'),
  });

  if (isLoading) {
    return (
      <div className="px-s-5 py-s-6 space-y-3 lg:px-8 lg:py-7">
        <Skeleton className="h-32 w-full" rounded="lg" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );
  }

  if (isError || !band) {
    return (
      <div className="px-s-5 py-s-6 lg:px-8 lg:py-7">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const isMember = myRole !== null && myRole !== undefined;
  const isLeader = hasRole(myRole, 'LEADER'); // ADMIN 역할은 현재 BE 미정의 — LEADER 만 관리 권한
  const isPendingApplicant = !isMember && myApplication?.status === 'PENDING';

  return (
    <div data-slot="band-detail">
      {/* TopBar — 72px height, 32px horizontal padding, bottom 1px border */}
      <header
        className="px-s-5 flex h-[72px] items-center justify-between gap-3 lg:px-8"
        data-slot="band-detail-topbar"
      >
        <div className="min-w-0">
          <h1 className="text-foreground truncate text-[22px] leading-snug font-bold">
            {band.bandName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isPendingApplicant && (
            <Button
              size="sm"
              variant="secondary"
              className="rounded-[5px] border-white/50 text-white/70 hover:border-transparent hover:bg-white/10 active:bg-white/20"
              onClick={() => withdrawMutation.mutate()}
              loading={withdrawMutation.isPending}
            >
              <UserMinus className="h-4 w-4" />
              가입 철회
            </Button>
          )}
          {!isMember && !isPendingApplicant && (
            <Button
              size="sm"
              variant="secondary"
              className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
              onClick={() => applyMutation.mutate()}
              loading={applyMutation.isPending}
            >
              <UserPlus className="h-4 w-4" />
              가입 신청
            </Button>
          )}
          {isMember && (
            <Button
              size="sm"
              variant="secondary"
              className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              밴드 탈퇴
            </Button>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
        {/* Tab bar — 48px height, 32px horizontal padding */}
        <div className="px-s-5 lg:px-8">
          <TabsList aria-label="밴드 상세 탭">
            <TabsTrigger
              value="info"
              className="data-[state=active]:text-foreground data-[state=active]:border-foreground"
            >
              정보
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="data-[state=active]:text-foreground data-[state=active]:border-foreground"
            >
              멤버
            </TabsTrigger>
            {isLeader && (
              <TabsTrigger
                value="applications"
                className="data-[state=active]:text-foreground data-[state=active]:border-foreground"
              >
                신청 현황
              </TabsTrigger>
            )}
            {isLeader && (
              <TabsTrigger
                value="settings"
                className="data-[state=active]:text-foreground data-[state=active]:border-foreground"
              >
                설정
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Content — padding 24px / 32px */}
        <div className="px-s-5 py-s-6 lg:px-8" data-slot="band-detail-content">
          <TabsContent value="info" className="mt-0">
            <InfoTab
              bandId={bandId}
              bandName={band.bandName}
              description={band.description}
              profileImg={band.profileImg}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            <MembersTab bandId={bandId} />
          </TabsContent>

          {isLeader && (
            <TabsContent value="applications" className="mt-0">
              <ApplicationsTab bandId={bandId} />
            </TabsContent>
          )}
          {isLeader && (
            <TabsContent value="settings" className="mt-0">
              <SettingsTab
                bandId={band.bandId}
                bandName={band.bandName}
                description={band.description}
                profileImg={band.profileImg}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>밴드에서 탈퇴하시겠어요?</DialogTitle>
            <DialogDescription>
              탈퇴 후에는 밴드의 합주 · 공연 · 신청 이력에 접근할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          {isLeader && (
            <DialogBody>
              <p className="text-foreground-sub text-sm">
                <span className="text-nav-active font-bold">리더 권한</span>은 탈퇴 시 다른 멤버에게
                자동으로 위임됩니다.
              </p>
            </DialogBody>
          )}
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => setLeaveOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              loading={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
            >
              탈퇴하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoTab({
  bandId,
  bandName,
  description,
  profileImg,
}: {
  bandId: string;
  bandName: string;
  description?: string;
  profileImg?: string;
}) {
  const members = useBandMembers(bandId, 20);
  const memberCount = members.data?.pages.flatMap((p) => p.content).length ?? 0;

  return (
    <div className="space-y-s-6">
      <div
        className="bg-card border-border flex h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl border"
        data-slot="band-cover"
        aria-label={`${bandName} 커버 이미지`}
      >
        {profileImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 origin 허용 위해 native img
          <img src={profileImg} alt={`${bandName} 커버`} className="h-full w-full object-cover" />
        ) : (
          <div className="text-foreground-muted gap-s-2 flex flex-col items-center">
            <ImagePlus className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs">밴드 커버 이미지 없음</span>
          </div>
        )}
      </div>

      <div className="space-y-s-2 max-w-[720px]">
        <p className="text-foreground-sub text-body leading-relaxed">
          {description ?? '소개가 등록되지 않았습니다.'}
        </p>
        <p className="text-foreground-muted text-caption">
          {members.isLoading ? '멤버 정보를 불러오는 중…' : `멤버 ${memberCount}명`}
        </p>
      </div>
    </div>
  );
}

function MembersTab({ bandId }: { bandId: string }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBandMembers(bandId, 20);

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const members = data?.pages.flatMap((p) => p.content) ?? [];
  if (members.length === 0) return <EmptyState title="멤버가 없습니다" />;

  return (
    <div className="space-y-s-3">
      <div className="gap-s-3 grid grid-cols-1 sm:grid-cols-2">
        {members.map((m) => (
          <BandMemberRow key={m.bandMemberId} bandId={bandId} member={m} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            더 불러오기
          </Button>
        </div>
      )}
    </div>
  );
}

const STATUS_FILTERS: { value: ApplicationStatus; label: string }[] = [
  { value: 'PENDING', label: '대기중' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
];

function ApplicationsTab({ bandId }: { bandId: string }) {
  const [status, setStatus] = useState<ApplicationStatus>('PENDING');
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBandApplications(bandId, status, 20);

  const apps = data?.pages.flatMap((p) => p.content) ?? [];
  const currentLabel = STATUS_FILTERS.find((f) => f.value === status)?.label ?? '';

  return (
    <div className="space-y-s-4">
      <div className="gap-s-2 flex flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            interactive
            selected={status === f.value}
            onClick={() => setStatus(f.value)}
            className={status === f.value ? 'bg-foreground text-bg border-foreground ring-0' : ''}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : apps.length === 0 ? (
        <p className="text-foreground-muted py-s-6 text-center text-sm">
          {currentLabel} 상태 신청이 없습니다
        </p>
      ) : (
        <div className="space-y-s-2">
          {apps.map((a) => (
            <BandApplicationRow
              key={a.bandApplicationId}
              bandId={bandId}
              application={a}
              onDecide={() => setStatus('PENDING')}
            />
          ))}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
                더 불러오기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsTab({
  bandId,
  bandName,
  description,
  profileImg,
}: {
  bandId: string;
  bandName: string;
  description?: string;
  profileImg?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInputId = useId();
  const [tab, setTab] = useState<'info' | 'image' | 'delete'>('info');
  const [name, setName] = useState(bandName);
  const [desc, setDesc] = useState(description ?? '');
  const [confirmText, setConfirmText] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  async function handleImageFile(file: File) {
    if (!isAllowedImageMime(file.type)) {
      toast.error('JPEG / PNG / WEBP 형식만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setImageUploading(true);
    try {
      const objectKey = await uploadProfileImage({ file, domain: 'BAND', bandId });
      updateMutation.mutate({ profileImg: objectKey });
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      toast.error(message);
      setLocalPreview(null);
    } finally {
      setImageUploading(false);
    }
  }

  function handleDeleteImage() {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    } else {
      deleteImageMutation.mutate();
    }
  }

  const currentImg = localPreview ?? profileImg ?? null;

  const updateMutation = useUpdateBand(bandId, {
    onSuccess: () => {
      setLocalPreview(null);
      toast.success('밴드 정보를 저장했습니다.');
    },
    onError: (err) => toast.error(err.message || '저장에 실패했습니다.'),
  });

  const deleteImageMutation = useDeleteBandProfileImage(bandId, {
    onSuccess: () => toast.success('이미지를 삭제했습니다.'),
    onError: (err) => toast.error(err.message || '이미지 삭제에 실패했습니다.'),
  });

  const deleteMutation = useDeleteBand(bandId, {
    onSuccess: () => {
      toast.success('밴드를 삭제했습니다.');
      router.replace(ROUTES.BANDS);
    },
    onError: (err) => toast.error(err.message || '삭제에 실패했습니다.'),
  });

  return (
    <div className="space-y-s-4 w-full">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'info' | 'image' | 'delete')}>
        <TabsList className="mb-s-4 w-full">
          <TabsTrigger
            value="info"
            className="flex-1 transition-all active:scale-95 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            정보
          </TabsTrigger>
          <TabsTrigger
            value="image"
            className="flex-1 transition-all active:scale-95 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            이미지
          </TabsTrigger>
          <TabsTrigger
            value="delete"
            className="flex-1 transition-all active:scale-95 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
          >
            삭제
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-s-3 mt-0">
          <Input
            label="밴드 이름"
            required
            value={name}
            placeholder="밴드 이름을 입력하세요"
            hint={<span className="block text-right">{name.length}/50자</span>}
            onChange={(e) => setName(e.target.value)}
            className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
          />
          <Textarea
            label="소개"
            required
            value={desc}
            placeholder="밴드 소개글을 입력하세요"
            hint={<span className="block text-right">{desc.length}/200자</span>}
            onChange={(e) => setDesc(e.target.value)}
            className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
          />
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="h-8 rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:border-neutral-100 hover:bg-neutral-100 active:border-neutral-200 active:bg-neutral-200"
              disabled={!name.trim() || !desc.trim()}
              onClick={() =>
                updateMutation.mutate({ name: name.trim(), description: desc.trim() || undefined })
              }
              loading={updateMutation.isPending}
            >
              저장
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-s-3 mt-0">
          {currentImg ? (
            <div className="relative mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImg}
                alt="밴드 프로필 이미지"
                className="h-[220px] w-full rounded-2xl object-cover"
              />
              {!imageUploading && (
                <button
                  type="button"
                  aria-label="이미지 제거"
                  onClick={handleDeleteImage}
                  className="bg-surface border-border absolute -top-2 -right-2 rounded-full border p-0.5 text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {imageUploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </span>
              )}
            </div>
          ) : (
            <label
              htmlFor={imageInputId}
              className="flex h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <ImagePlus className="h-8 w-8 text-white/50" />
              <span className="text-sm font-medium text-white/60">클릭하여 이미지 선택</span>
              <span className="text-xs text-white/40">JPEG · PNG · WEBP · 최대 5MB</span>
            </label>
          )}
          <input
            ref={imageInputRef}
            id={imageInputId}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handleImageFile(file);
            }}
          />
          {currentImg && !imageUploading && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="text-foreground-sub text-caption hover:text-foreground underline"
              >
                다른 이미지로 변경
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="delete" className="space-y-s-3 mt-0">
          <p className="text-foreground-sub text-xs">
            밴드를 삭제하면 모든 멤버·합주·공연 연결이 함께 제거되며 복구할 수 없습니다.
          </p>
          <div className="mt-s-5">
            <Input
              label={`밴드 이름(${bandName})을 그대로 입력해 주세요`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={bandName}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-3"
              onClick={() => deleteMutation.mutate()}
              disabled={confirmText !== bandName}
              loading={deleteMutation.isPending}
            >
              삭제
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
