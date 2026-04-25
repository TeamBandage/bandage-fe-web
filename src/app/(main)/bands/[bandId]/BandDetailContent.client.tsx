'use client';

import { Camera, LogOut, Settings, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
import { BandApplicationRow } from '@/domain/band/components/BandApplicationRow';
import { BandMemberRow } from '@/domain/band/components/BandMemberRow';
import { useApplyBand } from '@/domain/band/hooks/useApplyBand';
import { useBandApplications } from '@/domain/band/hooks/useBandApplications';
import { useBandDetail } from '@/domain/band/hooks/useBandDetail';
import { useBandMembers } from '@/domain/band/hooks/useBandMembers';
import { useLeaveBand } from '@/domain/band/hooks/useLeaveBand';
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
  const toast = useToast();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data: band, isLoading, isError, refetch } = useBandDetail(bandId);
  const { data: myRole } = useBandRole(bandId);

  const applyMutation = useApplyBand(bandId, {
    onSuccess: () => toast.success('가입 신청을 보냈습니다. 승인을 기다려 주세요.'),
    onError: (err) => toast.error(err.message || '가입 신청에 실패했습니다.'),
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

  return (
    <div data-slot="band-detail">
      {/* TopBar — 72px height, 32px horizontal padding, bottom 1px border */}
      <header
        className="border-border px-s-5 flex h-[72px] items-center justify-between gap-3 border-b lg:px-8"
        data-slot="band-detail-topbar"
      >
        <div className="min-w-0">
          <p className="text-foreground-muted text-caption">밴드 탐색</p>
          <h1 className="text-foreground truncate text-[22px] leading-snug font-bold">
            {band.bandName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isMember && (
            <Button
              size="sm"
              onClick={() => applyMutation.mutate()}
              loading={applyMutation.isPending}
            >
              <UserPlus className="h-4 w-4" />
              가입 신청
            </Button>
          )}
          {isMember && !isLeader && (
            <Button
              size="sm"
              variant="secondary"
              className="text-danger"
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              밴드 탈퇴
            </Button>
          )}
          {isLeader && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.info('밴드 설정 화면은 곧 제공될 예정입니다.')}
            >
              <Settings className="h-4 w-4" />
              밴드 설정
            </Button>
          )}
        </div>
      </header>

      <Tabs defaultValue="info" variant="underline">
        {/* Tab bar — 48px height, 32px horizontal padding */}
        <div className="px-s-5 lg:px-8">
          <TabsList aria-label="밴드 상세 탭">
            <TabsTrigger value="info">정보</TabsTrigger>
            <TabsTrigger value="members">멤버</TabsTrigger>
            {isLeader && <TabsTrigger value="applications">신청 현황</TabsTrigger>}
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
        </div>
      </Tabs>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>밴드에서 탈퇴하시겠어요?</DialogTitle>
            <DialogDescription>
              탈퇴 후에는 밴드의 합주 · 공연 · 신청 이력에 접근할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              LEADER 인 경우 먼저 리더 권한을 다른 멤버에게 위임해야 할 수 있습니다.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
              취소
            </Button>
            <Button
              variant="danger"
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
          <div className="text-foreground-muted gap-s-2 flex flex-col items-center text-xs">
            <Camera className="h-7 w-7" aria-hidden="true" />
            band cover image
          </div>
        )}
      </div>

      <div className="space-y-s-2 max-w-[720px]">
        <h2 className="text-foreground text-title font-extrabold">{bandName}</h2>
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
  { value: 'REJECTED', label: '거부됨' },
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
        <EmptyState title={`${currentLabel} 상태 신청이 없습니다`} />
      ) : (
        <div className="space-y-s-2">
          {apps.map((a) => (
            <BandApplicationRow key={a.bandApplicationId} bandId={bandId} application={a} />
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
