import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface WizardSummarySection {
  /** 섹션 제목 (예: '밴드', '곡', '일정', '메타'). */
  label: string;
  /** 표시할 값 — string 또는 커스텀 렌더. */
  value: ReactNode;
  /** 클릭 시 해당 step 으로 이동. */
  onEdit?: () => void;
  /** 시각 강조 (시작 시각·소요 시간 등 핵심 정보). */
  emphasized?: boolean;
}

export interface WizardSummaryCardProps {
  sections: WizardSummarySection[];
  className?: string;
}

/**
 * 마법사 검토(확정) 단계의 재사용 패널.
 * 라벨/값 + 수정 링크 + 강조 표시 — Practice/Performance 마법사 공통.
 */
export function WizardSummaryCard({ sections, className }: WizardSummaryCardProps) {
  return (
    <ul
      data-slot="wizard-summary-card"
      className={cn('bg-card border-border space-y-s-3 px-s-5 py-s-4 rounded-md border', className)}
    >
      {sections.map((s, i) => (
        <li
          key={i}
          className={cn(
            'gap-s-3 flex items-start justify-between',
            s.emphasized && 'p-s-3 -mx-s-2 rounded-md border border-white/20 bg-white/5',
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-foreground-muted text-micro mb-1 font-semibold tracking-wider uppercase">
              {s.label}
            </p>
            <div
              className={cn(
                s.emphasized ? 'text-subtitle font-bold text-white' : 'text-foreground text-body',
              )}
            >
              {s.value}
            </div>
          </div>
          {s.onEdit && (
            <button
              type="button"
              onClick={s.onEdit}
              className="text-foreground-muted text-micro inline-flex shrink-0 items-center gap-1 font-semibold hover:text-white"
              aria-label={`${s.label} 수정`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              수정
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
