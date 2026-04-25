'use client';

import { Avatar } from '@/components/ui/avatar';
import { EntityPickerModal } from '@/components/ui/entity-picker-modal';
import { getMemberDisplayName } from '@/domain/member/utils';

import { getBandMembers } from '../api/getBandMembers';
import type { BandMemberInfoResponse } from '../types';

export interface MemberPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 검색 대상 밴드. 미존재 시 모달은 빈 결과. */
  bandId: string;
  multiple?: boolean;
  initialSelection?: BandMemberInfoResponse[];
  onConfirm: (members: BandMemberInfoResponse[]) => void;
  title?: string;
}

/**
 * 밴드 멤버 검색 + 선택 모달.
 * 백엔드 멤버 검색 API 미지원 — getBandMembers 의 첫 100건을 클라이언트에서 name 부분 매칭.
 * (FE-API-021 멤버 검색 엔드포인트 추가 예정 — API_REQUIRED.md 참조)
 */
export function MemberPickerModal({
  open,
  onOpenChange,
  bandId,
  multiple = false,
  initialSelection,
  onConfirm,
  title = '멤버 선택',
}: MemberPickerModalProps) {
  async function fetcher(keyword: string): Promise<BandMemberInfoResponse[]> {
    if (!bandId) return [];
    const page = await getBandMembers(bandId, { pageSize: 100 });
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return page.content;
    return page.content.filter((m) =>
      getMemberDisplayName({ memberId: m.memberId, name: m.name }).toLowerCase().includes(trimmed),
    );
  }

  return (
    <EntityPickerModal<BandMemberInfoResponse>
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      placeholder="멤버 이름으로 검색…"
      multiple={multiple}
      fetcher={fetcher}
      getKey={(m) => m.bandMemberId}
      initialSelection={initialSelection}
      onConfirm={onConfirm}
      renderItem={(m, selected) => {
        const displayName = getMemberDisplayName({ memberId: m.memberId, name: m.name });
        return (
          <div
            className={
              'border-border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex items-center rounded-md border transition-colors ' +
              (selected ? 'border-accent bg-accent-dim' : '')
            }
          >
            <Avatar size="md" fallback={displayName} />
            <div className="min-w-0 flex-1">
              <div className="text-body truncate font-semibold">{displayName}</div>
              <div className="text-foreground-muted text-caption truncate">
                {m.role === 'LEADER' ? '리더' : m.role === 'ADMIN' ? '관리자' : '멤버'}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
