import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface MyItemMarkerProps {
  /** 카드 우상단 칩 라벨. 기본 '내 항목'. */
  label?: string;
  className?: string;
}

/**
 * 탐색 카드 우상단에 노출되는 "내 항목" 마커 칩.
 * 좌측 보더 강조와 함께 사용 — 부모 컨테이너에서 `my-item-card` 헬퍼 클래스 적용.
 */
export function MyItemMarker({ label = '내 항목', className }: MyItemMarkerProps) {
  return (
    <span
      data-slot="my-item-marker"
      className={cn(
        'bg-accent-dim text-accent gap-s-1 px-s-2 text-micro inline-flex shrink-0 items-center rounded-full py-0.5 font-semibold',
        className,
      )}
      aria-label={label}
    >
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * 카드 컨테이너 className 헬퍼 — `mine=true` 면 좌측 accent 2px 보더를 추가.
 *
 * 사용 예:
 *   <Link className={cn(listItemClasses(...), myItemBorder(isMine))}>
 */
export function myItemBorder(mine: boolean): string {
  return mine ? 'border-l-2 border-l-accent' : '';
}
