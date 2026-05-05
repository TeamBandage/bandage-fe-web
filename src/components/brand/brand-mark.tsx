import type { SVGProps } from 'react';

import { cn } from '@/lib/cn';

export interface BrandMarkProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  /** 아이콘 픽셀 사이즈 (정사각). 기본 28. */
  size?: number;
  /** 단색 모드. light = 흰색 단색, dark = 어두운 단색, undefined = 풀컬러(액센트 블루). */
  tone?: 'light' | 'dark';
  /** 접근성 라벨. 장식용이면 생략 — aria-hidden 자동 부여. */
  title?: string;
}

/**
 * Bandage 브랜드 마크 (Unfurl Pulse).
 * 말린 붕대(좌측 원) + 펄스 띠(우측 라인). 64×64 viewBox.
 * design/bandage-logo/unfurl-pulse/ 의 SVG 와 동일.
 */
export function BrandMark({ size = 28, tone, title, className, ...props }: BrandMarkProps) {
  const accent = tone === 'light' ? '#f4f4f8' : tone === 'dark' ? '#0d0d12' : '#3563eb';
  const ink = tone === 'dark' ? '#f4f4f8' : '#0d0d12';
  const decorated = Boolean(title);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role={decorated ? 'img' : undefined}
      aria-hidden={decorated ? undefined : true}
      aria-label={decorated ? title : undefined}
      className={cn('shrink-0', className)}
      {...props}
    >
      <circle cx="18" cy="32" r="11" fill={accent} />
      <circle cx="18" cy="32" r="7.5" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.85" />
      <circle cx="18" cy="32" r="4" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.7" />
      <circle cx="18" cy="32" r="1.1" fill={ink} />
      <path
        d="M 27 32 L 34 32 L 38 24 L 42 40 L 46 28 L 50 32 L 58 32"
        stroke={accent}
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 27 32 L 34 32 L 38 24 L 42 40 L 46 28 L 50 32 L 58 32"
        stroke={ink}
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}
