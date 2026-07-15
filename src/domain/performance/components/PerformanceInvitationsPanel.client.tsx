'use client';

import { UserPlus } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteManagerModal } from '@/domain/performance/components/InviteManagerModal.client';
import { useDecidePerformanceInvitation } from '@/domain/performance/hooks/useDecidePerformanceInvitation';
import { useMyPerformanceInvitations } from '@/domain/performance/hooks/useMyPerformanceInvitations';
import { usePerformanceInvitations } from '@/domain/performance/hooks/usePerformanceInvitations';
import { useSendPerformanceInvitation } from '@/domain/performance/hooks/useSendPerformanceInvitation';
import type {
  PerformanceInvitationResponse,
  PerformanceInvitationStatus,
} from '@/domain/performance/types/res';
import { useToast } from '@/hooks/useToast';

const STATUS_LABEL: Record<PerformanceInvitationStatus, string> = {
  PENDING: '대기중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  CANCELED: '취소됨',
};

const STATUS_VARIANT: Record<PerformanceInvitationStatus, BadgeVariant> = {
  PENDING: 'warn',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  CANCELED: 'muted',
};

function formatInvitedAt(createdAt: string) {
  // 백엔드가 초 이하 자릿수가 가변인 ISO 문자열(예: 2026-07-05T05:23:04.628454)을 내려줘
  // date-fns 고정 패턴 파싱이 깨지므로, 표시에 필요한 시:분까지만 직접 추출한다.
  const match = createdAt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : createdAt;
}

export function PerformanceInvitationsPanel({
  performanceId,
  isOwner,
}: {
  performanceId: string;
  isOwner: boolean;
}) {
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: sentInvitations = [] } = usePerformanceInvitations(performanceId, {
    enabled: isOwner,
  });
  const { data: myInvitations = [] } = useMyPerformanceInvitations({ enabled: !isOwner });

  const sendMutation = useSendPerformanceInvitation(performanceId, {
    onSuccess: () => toast.success('초대를 보냈습니다.'),
    onError: (err) => toast.error(err.message || '초대 전송에 실패했습니다.'),
  });

  if (isOwner) {
    return (
      <div className="space-y-s-3">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-base font-semibold">보낸 초대</p>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 rounded-[5px] px-2"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            매니저 초대
          </Button>
        </div>

        {sentInvitations.length === 0 ? (
          <EmptyState title="보낸 초대가 없습니다" compact />
        ) : (
          <ul className="space-y-s-2">
            {sentInvitations.map((inv) => (
              <SentInvitationRow key={inv.invitationId} invitation={inv} />
            ))}
          </ul>
        )}

        <InviteManagerModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onConfirm={(member) => sendMutation.mutate({ memberId: member.memberId })}
        />
      </div>
    );
  }

  const myInvitationsForPerformance = myInvitations.filter(
    (inv) => inv.performanceId === performanceId,
  );

  return myInvitationsForPerformance.length === 0 ? (
    <EmptyState title="받은 초대 요청이 없습니다" compact />
  ) : (
    <ul className="space-y-s-2">
      {myInvitationsForPerformance.map((inv) => (
        <MyInvitationRow key={inv.invitationId} performanceId={performanceId} invitation={inv} />
      ))}
    </ul>
  );
}

function SentInvitationRow({ invitation }: { invitation: PerformanceInvitationResponse }) {
  const name = invitation.invitedMemberName ?? `멤버 #${invitation.invitedMemberId}`;
  return (
    <li className="bg-card border-border gap-s-3 p-s-3 flex items-center rounded-md border">
      <Avatar size="lg" src={invitation.invitedMemberProfileImg ?? undefined} fallback={name} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{name}</p>
        <p className="text-foreground-muted text-caption mt-0.5">
          {formatInvitedAt(invitation.createdAt)}
        </p>
      </div>
      <Badge variant={STATUS_VARIANT[invitation.status]}>{STATUS_LABEL[invitation.status]}</Badge>
    </li>
  );
}

function MyInvitationRow({
  performanceId,
  invitation,
}: {
  performanceId: string;
  invitation: PerformanceInvitationResponse;
}) {
  const toast = useToast();
  const decideMutation = useDecidePerformanceInvitation(performanceId, {
    onError: (err) => toast.error(err.message || '처리에 실패했습니다.'),
  });

  function decide(status: 'ACCEPTED' | 'REJECTED') {
    decideMutation.mutate(
      { invitationId: invitation.invitationId, status },
      {
        onSuccess: () =>
          toast.success(status === 'ACCEPTED' ? '초대를 수락했습니다.' : '초대를 거절했습니다.'),
      },
    );
  }

  return (
    <li className="bg-card border-border gap-s-3 p-s-3 flex items-center rounded-md border">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">
          {invitation.performanceTitle}
        </p>
        <p className="text-foreground-muted text-caption mt-0.5">
          {formatInvitedAt(invitation.createdAt)}
        </p>
      </div>
      {invitation.status === 'PENDING' ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-success hover:bg-success/90 rounded-[5px]"
            loading={decideMutation.isPending}
            onClick={() => decide('ACCEPTED')}
          >
            수락
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="rounded-[5px]"
            loading={decideMutation.isPending}
            onClick={() => decide('REJECTED')}
          >
            거절
          </Button>
        </div>
      ) : (
        <Badge variant={STATUS_VARIANT[invitation.status]}>{STATUS_LABEL[invitation.status]}</Badge>
      )}
    </li>
  );
}
