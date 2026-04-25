'use client';

import { LogOut, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BandApplicationRow } from '@/domain/band/components/BandApplicationRow';
import { BandMemberRow } from '@/domain/band/components/BandMemberRow';
import { useApplyBand } from '@/domain/band/hooks/useApplyBand';
import { useBandApplications } from '@/domain/band/hooks/useBandApplications';
import { useBandDetail } from '@/domain/band/hooks/useBandDetail';
import { useBandMembers } from '@/domain/band/hooks/useBandMembers';
import { useLeaveBand } from '@/domain/band/hooks/useLeaveBand';
import { RoleGuard, hasRole } from '@/global/auth/RoleGuard';
import { useBandRole } from '@/global/auth/useBandRole';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

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
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" rounded="lg" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );
  }

  if (isError || !band) {
    return <ErrorState title="밴드를 찾을 수 없습니다" onRetry={() => refetch()} />;
  }

  const isMember = myRole !== null && myRole !== undefined;
  const canSeeApplications = hasRole(myRole, 'ADMIN');

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="flex items-start gap-4">
          <Avatar
            size="xl"
            src={band.profileImg}
            fallback={band.bandName}
            alt={`${band.bandName} 프로필`}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground text-xl font-bold">{band.bandName}</h1>
            {band.description && (
              <p className="text-foreground-sub mt-1 text-sm">{band.description}</p>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">정보</TabsTrigger>
          <TabsTrigger value="members">멤버</TabsTrigger>
          {canSeeApplications && <TabsTrigger value="applications">신청 현황</TabsTrigger>}
        </TabsList>

        <TabsContent value="info">
          <Card padding="lg">
            <div className="space-y-3">
              <p className="text-foreground-sub text-sm">
                {band.description ?? '소개가 등록되지 않았습니다.'}
              </p>
              <div className="flex gap-2">
                {!isMember && (
                  <Button onClick={() => applyMutation.mutate()} loading={applyMutation.isPending}>
                    <UserPlus className="h-4 w-4" />
                    가입 신청
                  </Button>
                )}
                {isMember && (
                  <Button
                    variant="ghost"
                    className="text-danger hover:opacity-80"
                    onClick={() => setLeaveOpen(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    밴드 탈퇴
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <MembersTab bandId={bandId} />
        </TabsContent>

        {canSeeApplications && (
          <TabsContent value="applications">
            <RoleGuard
              bandId={bandId}
              role="ADMIN"
              fallback={<EmptyState title="접근 권한이 없습니다" />}
            >
              <ApplicationsTab bandId={bandId} />
            </RoleGuard>
          </TabsContent>
        )}
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

function MembersTab({ bandId }: { bandId: string }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBandMembers(bandId, 20);

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const members = data?.pages.flatMap((p) => p.content) ?? [];
  if (members.length === 0) return <EmptyState title="멤버가 없습니다" />;

  return (
    <div>
      {members.map((m) => (
        <BandMemberRow key={m.bandMemberId} bandId={bandId} member={m} />
      ))}
      {hasNextPage && (
        <div className="mt-3 flex justify-center">
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

function ApplicationsTab({ bandId }: { bandId: string }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBandApplications(bandId, 'PENDING', 20);

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const apps = data?.pages.flatMap((p) => p.content) ?? [];
  if (apps.length === 0) return <EmptyState title="대기 중인 가입 신청이 없습니다" />;

  return (
    <div>
      {apps.map((a) => (
        <BandApplicationRow key={a.bandApplicationId} bandId={bandId} application={a} />
      ))}
      {hasNextPage && (
        <div className="mt-3 flex justify-center">
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
