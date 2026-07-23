'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDecideApplication } from '@/domain/band/hooks/useDecideApplication';
import { getMemberDisplayName } from '@/domain/member/utils';
import { useToast } from '@/hooks/useToast';

import type { BandApplicationInfoResponse } from '../types';

type Props = {
  bandId: string;
  application: BandApplicationInfoResponse;
  onDecide?: () => void;
};

const STATUS_LABEL: Record<BandApplicationInfoResponse['status'], string> = {
  PENDING: '대기',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
  WITHDRAWN: '신청 철회',
  LEAVED: '탈퇴',
};

const STATUS_VARIANT: Record<BandApplicationInfoResponse['status'], BadgeVariant> = {
  PENDING: 'default',
  APPROVED: 'blue',
  REJECTED: 'danger',
  WITHDRAWN: 'muted',
  LEAVED: 'muted',
};

export function BandApplicationRow({ bandId, application, onDecide }: Props) {
  const toast = useToast();
  const mutation = useDecideApplication(bandId, {
    onSuccess: (vars) => {
      toast.success(vars.decision === 'APPROVED' ? '가입을 승인했습니다.' : '가입을 거절했습니다.');
      onDecide?.();
    },
    onError: (err) => toast.error(err.message || '처리에 실패했습니다.'),
  });

  const isPending = application.status === 'PENDING';
  const displayName = getMemberDisplayName({
    memberId: application.memberId,
    name: application.applicantName,
  });

  return (
    <div
      className="bg-card border-border gap-s-3 p-s-3 flex items-center rounded-md border"
      data-slot="band-application-row"
    >
      <Avatar size="lg" src={application.applicantProfileImg ?? undefined} fallback={displayName} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{displayName}</p>
        {isPending && <p className="text-foreground-muted text-caption mt-0.5">신청 대기 중</p>}
      </div>
      {isPending ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            className="bg-blue hover:bg-blue/80 border-blue hover:border-blue/80 rounded-[5px]"
            onClick={() =>
              mutation.mutate({
                applicationId: application.bandApplicationId,
                decision: 'APPROVED',
              })
            }
            loading={mutation.isPending}
          >
            승인
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="rounded-[5px]"
            onClick={() =>
              mutation.mutate({
                applicationId: application.bandApplicationId,
                decision: 'REJECTED',
              })
            }
            loading={mutation.isPending}
          >
            거절
          </Button>
        </div>
      ) : (
        <Badge variant={STATUS_VARIANT[application.status]}>
          {STATUS_LABEL[application.status]}
        </Badge>
      )}
    </div>
  );
}
