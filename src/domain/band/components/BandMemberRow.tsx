'use client';

import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDelegateLeader } from '@/domain/band/hooks/useDelegateLeader';
import { RoleGuard } from '@/global/auth/RoleGuard';
import { useToast } from '@/hooks/useToast';

import { BandRoleBadge } from './BandRoleBadge';
import type { BandMemberInfoResponse } from '../types';

type Props = {
  bandId: string;
  member: BandMemberInfoResponse;
};

export function BandMemberRow({ bandId, member }: Props) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const delegateMutation = useDelegateLeader(bandId, {
    onSuccess: () => {
      toast.success('리더 권한을 위임했습니다.');
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || '리더 위임에 실패했습니다.'),
  });

  // 멤버 표시명: 백엔드가 name 을 아직 안 주므로 임시로 "Member #{memberId}" 사용 (Phase G 에서 정상화)
  const displayName = `Member #${member.memberId}`;

  return (
    <div
      className="bg-card border-border gap-s-3 p-s-3 flex items-center rounded-md border"
      data-slot="band-member-row"
    >
      <Avatar size="lg" fallback={displayName} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{displayName}</p>
        <div className="mt-1">
          <BandRoleBadge role={member.role} />
        </div>
      </div>
      {member.role !== 'LEADER' && (
        <RoleGuard bandId={bandId} role="LEADER">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            위임
          </Button>
        </RoleGuard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>리더 권한 위임</DialogTitle>
            <DialogDescription>
              이 멤버에게 리더 권한을 넘깁니다. 위임 후 본인은 일반 멤버로 전환됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              {displayName} 에게 리더를 위임하시겠어요? 이 동작은 되돌릴 수 없습니다.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="primary"
              loading={delegateMutation.isPending}
              onClick={() => delegateMutation.mutate(member.bandMemberId)}
            >
              위임하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
