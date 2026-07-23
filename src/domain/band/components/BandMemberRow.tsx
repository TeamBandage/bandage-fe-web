'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
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
import { useRemoveBandMember } from '@/domain/band/hooks/useRemoveBandMember';
import { getMemberDisplayName } from '@/domain/member/utils';
import { RoleGuard } from '@/global/auth/RoleGuard';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { BandRoleBadge } from './BandRoleBadge';
import type { BandMemberInfoResponse } from '../types';

type Props = {
  bandId: string;
  member: BandMemberInfoResponse;
};

export function BandMemberRow({ bandId, member }: Props) {
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const toast = useToast();

  const delegateMutation = useDelegateLeader(bandId, {
    onSuccess: () => {
      toast.success('리더 권한을 위임했습니다.');
      setDelegateOpen(false);
    },
    onError: (err) => toast.error(err.message || '리더 위임에 실패했습니다.'),
  });

  const removeMutation = useRemoveBandMember(bandId, {
    onSuccess: () => {
      toast.success('멤버를 강퇴했습니다.');
      setRemoveOpen(false);
    },
    onError: (err) => toast.error(err.message || '강퇴에 실패했습니다.'),
  });

  const displayName = getMemberDisplayName({ memberId: member.memberId, name: member.name });

  return (
    <div
      className="bg-card border-border gap-s-3 p-s-3 flex items-center rounded-md border"
      data-slot="band-member-row"
    >
      <Avatar size="lg" src={member.profileImg ?? undefined} fallback={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-foreground truncate text-sm font-semibold">{displayName}</p>
          <BandRoleBadge role={member.role} className="shrink-0 bg-white/10 text-white" />
        </div>
      </div>

      {member.role !== 'LEADER' && (
        <RoleGuard bandId={bandId} role="LEADER">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="멤버 옵션"
                className="text-foreground-sub hover:text-foreground focus-visible:ring-accent rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className={cn(
                  'bg-card border-border z-50 min-w-[90px] rounded-lg border py-1 shadow-lg',
                  'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
                )}
              >
                <DropdownMenu.Item
                  className="text-foreground hover:bg-surface-hi cursor-pointer px-4 py-2.5 text-sm outline-none"
                  onSelect={() => setDelegateOpen(true)}
                >
                  리더 위임
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="text-danger hover:bg-surface-hi cursor-pointer px-4 py-2.5 text-sm outline-none"
                  onSelect={() => setRemoveOpen(true)}
                >
                  내보내기
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </RoleGuard>
      )}

      {/* 리더 위임 다이얼로그 */}
      <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>리더 권한 위임</DialogTitle>
            <DialogDescription>
              해당 멤버에게 리더 권한을 넘깁니다. 위임 후 본인은 일반 멤버로 전환됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              <span className="text-nav-active font-bold">{displayName}</span> 에게 리더를
              위임하시겠어요? 이 동작은 되돌릴 수 없습니다.
            </p>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button variant="ghost" className="h-8" onClick={() => setDelegateOpen(false)}>
              취소
            </Button>
            <Button
              variant="secondary"
              className="h-8 rounded-[5px] border-white bg-white px-2 text-neutral-900 hover:border-neutral-100 hover:bg-neutral-100"
              loading={delegateMutation.isPending}
              onClick={() => delegateMutation.mutate(member.bandMemberId)}
            >
              위임하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 멤버 강퇴 다이얼로그 */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>멤버 강제 탈퇴</DialogTitle>
            <DialogDescription>해당 멤버를 밴드에서 강제 탈퇴시킵니다.</DialogDescription>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              <span className="text-nav-active font-bold">{displayName}</span> 을(를)
              내보내시겠어요? 이 동작은 되돌릴 수 없습니다.
            </p>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => setRemoveOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              loading={removeMutation.isPending}
              onClick={() => removeMutation.mutate(member.bandMemberId)}
            >
              내보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
