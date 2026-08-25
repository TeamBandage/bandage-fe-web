'use client';

import { Avatar } from '@/components/ui/avatar';
import { EntityPickerModal } from '@/components/ui/entity-picker-modal';
import { searchMembers } from '@/domain/member/api/searchMembers';
import type { MemberSearchItemResponse } from '@/domain/member/types';
import { cn } from '@/lib/cn';

export interface InviteManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (member: MemberSearchItemResponse) => void;
}

export function InviteManagerModal({ open, onOpenChange, onConfirm }: InviteManagerModalProps) {
  return (
    <EntityPickerModal<MemberSearchItemResponse, number>
      open={open}
      onOpenChange={onOpenChange}
      title="매니저 초대"
      placeholder="이름 · 이메일로 검색"
      paginatedFetcher={({ keyword, lastId, pageSize }) =>
        searchMembers(keyword, { pageSize, lastId })
      }
      getKey={(m) => String(m.memberId)}
      footerClassName="border-t-0"
      cancelButtonClassName="h-8 rounded-[5px]"
      confirmButtonClassName="h-8 rounded-[5px] bg-white px-3 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
      onConfirm={(selection) => {
        const member = selection[0];
        if (member) onConfirm(member);
      }}
      renderItem={(m, selected) => (
        <div
          className={cn(
            'border-border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex items-center rounded-md border transition-colors',
            selected && 'border-white/60',
          )}
        >
          <Avatar size="md" src={m.profileImg ?? undefined} fallback={m.name} />
          <div className="min-w-0 flex-1">
            <div className="text-body truncate font-semibold">{m.name}</div>
            <div className="text-foreground-muted text-caption truncate">{m.email}</div>
          </div>
        </div>
      )}
    />
  );
}
