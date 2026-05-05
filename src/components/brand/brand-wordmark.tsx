import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { BrandMark } from './brand-mark';

type WordmarkSize = 'sm' | 'md' | 'lg';

const SIZE_PRESETS: Record<
  WordmarkSize,
  { mark: number; textClass: string; gapClass: string; trackingClass: string }
> = {
  sm: { mark: 22, textClass: 'text-body', gapClass: 'gap-s-2', trackingClass: 'tracking-tight' },
  md: {
    mark: 30,
    textClass: 'text-title-lg',
    gapClass: 'gap-s-3',
    trackingClass: 'tracking-tight',
  },
  lg: {
    mark: 56,
    textClass: 'text-display',
    gapClass: 'gap-s-3',
    trackingClass: 'tracking-tight',
  },
};

export interface BrandWordmarkProps extends HTMLAttributes<HTMLSpanElement> {
  /** 사이즈 프리셋. mark 픽셀과 워드마크 텍스트 크기를 함께 정한다. 기본 `md`. */
  size?: WordmarkSize;
  /** 접근성 라벨. 장식용이면 생략 — aria-hidden 자동 부여. */
  title?: string;
}

/**
 * Bandage 워드마크 (mark + 텍스트 lock-up).
 * 텍스트는 부모의 `text-*` 색상 토큰을 그대로 따른다 (currentColor).
 * mark 자체는 항상 풀컬러(#3563eb 액센트).
 *
 * design/bandage-logo/unfurl-pulse/wordmark.svg 의 lock-up 비율을 컴포넌트로 옮긴 것.
 */
export function BrandWordmark({ size = 'md', title, className, ...props }: BrandWordmarkProps) {
  const preset = SIZE_PRESETS[size];
  const decorated = Boolean(title);

  return (
    <span
      className={cn('inline-flex items-center', preset.gapClass, className)}
      role={decorated ? 'img' : undefined}
      aria-label={decorated ? title : undefined}
      aria-hidden={decorated ? undefined : true}
      {...props}
    >
      <BrandMark size={preset.mark} />
      <span className={cn(preset.textClass, preset.trackingClass, 'leading-none font-black')}>
        Bandage
      </span>
    </span>
  );
}
