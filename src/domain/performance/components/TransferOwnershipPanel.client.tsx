'use client';

import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getMemberById } from '@/domain/member/api/getMemberById';
import { useTransferPerformanceOwner } from '@/domain/performance/hooks/useTransferPerformanceOwner';
import { queryKeys } from '@/global/config/queryKeys';
import { useToast } from '@/hooks/useToast';

interface ManagerCandidate {
  memberId: number;
  name: string;
  profileImg?: string | null;
}

export function TransferOwnershipPanel({
  performanceId,
  managerIds,
}: {
  performanceId: string;
  managerIds: number[];
}) {
  const toast = useToast();
  const [target, setTarget] = useState<ManagerCandidate | null>(null);

  const memberQueries = useQueries({
    queries: managerIds.map((memberId) => ({
      queryKey: queryKeys.member.detail(memberId),
      queryFn: () => getMemberById(memberId),
    })),
  });
  const membersLoading = memberQueries.some((q) => q.isLoading);
  const candidates: ManagerCandidate[] = managerIds.map((memberId, i) => {
    const member = memberQueries[i]?.data;
    return {
      memberId,
      name: member?.name ?? `멤버 #${memberId}`,
      profileImg: member?.profileImg,
    };
  });

  const transferMutation = useTransferPerformanceOwner(performanceId, {
    onSuccess: () => {
      toast.success('소유권을 양도했습니다.');
      setTarget(null);
    },
    onError: (err) => toast.error(err.message || '소유권 양도에 실패했습니다.'),
  });

  return (
    <div className="space-y-s-3">
      <p className="text-foreground-sub text-xs">
        선택한 매니저에게 소유권을 양도하면 본인은 매니저로 강등됩니다.
      </p>

      {membersLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState title="양도할 수 있는 매니저가 없습니다" compact />
      ) : (
        <ul className="space-y-s-2">
          {candidates.map((c) => (
            <li
              key={c.memberId}
              className="bg-card border-border gap-s-3 p-s-3 flex items-center rounded-md border"
            >
              <Avatar size="lg" src={c.profileImg ?? undefined} fallback={c.name} />
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">{c.name}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-[5px] px-2"
                onClick={() => setTarget(c)}
              >
                양도
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(o) => {
          if (!o) setTarget(null);
        }}
      >
        <DialogContent srOnlyTitle="소유권 양도">
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>소유권을 양도하시겠어요?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              <strong className="text-foreground">{target?.name}</strong>님에게 소유권을 양도합니다.
              양도 후 본인은 매니저로 전환됩니다.
            </p>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button variant="ghost" className="h-8 rounded-[5px]" onClick={() => setTarget(null)}>
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              loading={transferMutation.isPending}
              onClick={() => {
                if (target) transferMutation.mutate({ targetMemberId: target.memberId });
              }}
            >
              양도
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
