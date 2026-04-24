'use client';

import { Crown } from 'lucide-react';
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

  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="md" fallback={`M${member.memberId}`} />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-medium">Member #{member.memberId}</p>
          <p className="text-foreground-muted truncate text-xs">id: {member.bandMemberId}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <BandRoleBadge role={member.role} />
        {member.role !== 'LEADER' && (
          <RoleGuard bandId={bandId} role="LEADER">
            <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
              <Crown className="h-4 w-4" />
              리더 위임
            </Button>
          </RoleGuard>
        )}
      </div>

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
              Member #{member.memberId} 에게 리더를 위임하시겠어요? 이 동작은 되돌릴 수 없습니다.
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
