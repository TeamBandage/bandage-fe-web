'use client';

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type OAuthProvider = 'kakao' | 'google' | 'apple';

export interface OAuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: OAuthProvider;
}

const META: Record<OAuthProvider, { label: string; className: string; icon: React.ReactNode }> = {
  kakao: {
    label: '카카오로 계속하기',
    className: 'bg-[#FEE500] text-[#191600] hover:brightness-95',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.83 5.33 4.58 6.76l-1.1 4.03c-.1.35.27.63.57.42L11 19c.33.03.66.04 1 .04 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
      </svg>
    ),
  },
  google: {
    label: '구글로 계속하기',
    className: 'bg-white text-[#1F1F1F] border border-[#DADCE0] hover:bg-[#F8F9FA]',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3A12 12 0 0 1 12 24a12 12 0 0 1 19.7-9.2l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.7 2.8l5.7-5.7A20 20 0 0 0 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z"
        />
      </svg>
    ),
  },
  apple: {
    label: 'Apple로 계속하기',
    className: 'bg-black text-white hover:brightness-110',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.2 9.1.7 1.1 1.6 2.4 2.8 2.3 1.1 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.3 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.3-.9-2.3-3.5zM14.5 5.6c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" />
      </svg>
    ),
  },
};

/**
 * OAuth 버튼. 현재는 구현 미완(onClick 미정의 시 '준비 중' 표시용). 추후 실제 redirect 로 연결.
 */
export function OAuthButton({ provider, className, children, ...props }: OAuthButtonProps) {
  const meta = META[provider];
  return (
    <button
      type="button"
      className={cn(
        'gap-s-2 px-s-4 text-body flex h-11 w-full items-center justify-center rounded-md font-semibold transition-all',
        'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        meta.className,
        className,
      )}
      data-slot="oauth-button"
      data-provider={provider}
      {...props}
    >
      {meta.icon}
      <span>{children ?? meta.label}</span>
    </button>
  );
}
