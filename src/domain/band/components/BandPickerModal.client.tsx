'use client';

import { Music2 } from 'lucide-react';

import { EntityPickerModal } from '@/components/ui/entity-picker-modal';

import { searchBands } from '../api/searchBands';
import type { BandInfoResponse } from '../types';

export interface BandPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 다중 선택 여부 (기본 false). */
  multiple?: boolean;
  /** 사전 선택값. */
  initialSelection?: BandInfoResponse[];
  /** 확인 시 호출. multiple=false 면 길이 1 또는 0. */
  onConfirm: (bands: BandInfoResponse[]) => void;
  /** 모달 제목. */
  title?: string;
}

async function fetchBandsByKeyword(keyword: string): Promise<BandInfoResponse[]> {
  const page = await searchBands({ keyword, pageSize: 30 });
  return page.content;
}

/**
 * 밴드 검색 + 선택 모달.
 * API_SPEC §3-3-2 GET /api/v1/bands/search 를 사용. UUID 직접 입력을 대체.
 */
export function BandPickerModal({
  open,
  onOpenChange,
  multiple = false,
  initialSelection,
  onConfirm,
  title = '밴드 선택',
}: BandPickerModalProps) {
  return (
    <EntityPickerModal<BandInfoResponse>
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      placeholder="밴드명으로 검색…"
      multiple={multiple}
      fetcher={fetchBandsByKeyword}
      getKey={(b) => b.bandId}
      initialSelection={initialSelection}
      onConfirm={onConfirm}
      renderItem={(b, selected) => (
        <div
          className={
            'border-border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex items-center rounded-md border transition-colors ' +
            (selected ? 'border-accent bg-accent-dim' : '')
          }
        >
          <span className="bg-accent-dim text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
            <Music2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-body truncate font-semibold">{b.bandName}</div>
            {b.description && (
              <div className="text-foreground-muted text-caption truncate">{b.description}</div>
            )}
          </div>
        </div>
      )}
    />
  );
}
