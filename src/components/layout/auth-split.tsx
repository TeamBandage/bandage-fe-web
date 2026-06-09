import { Check } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { BrandMark } from '../brand';
import { HeroCinematic } from './HeroCinematic.client';

const BRAND_TAGLINE =
  '밴드의 합주·공연을 한 곳에서 관리하세요. 일정·세션·참여자까지 번거로움 없이.';

const BRAND_FEATURES = ['합주 일정 관리', '세션 배정', '공연 연결'] as const;

/**
 * Auth 화면 좌측 브랜딩 패널 (desktop 전용, lg 미만 hidden).
 * design/dist/css/layout.css .auth-brand 스펙 미러링.
 * - 145deg gradient, 3 decorative rings, 72px 로고, 40px title, tagline, feature chips
 */
export function AuthBrand({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn(
        'border-border relative hidden flex-1 flex-col items-center justify-center overflow-hidden border-r px-15 py-15 lg:flex',
        className,
      )}
      style={{ backgroundImage: 'var(--gradient-auth-brand)' }}
      data-slot="auth-brand"
      aria-hidden="true"
      {...props}
    >
      {/* Decorative rings */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-20">
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            top: '10%',
            border: '1px solid oklch(0.62 0.22 250 / 0.12)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            top: '20%',
            border: '1px solid oklch(0.62 0.22 250 / 0.12)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            top: '25%',
            background: 'oklch(0.62 0.22 250 / 0.05)',
          }}
        />
      </div>

      <div className="relative z-[1] max-w-sm text-center">
        <div
          className="bg-accent-dim mb-s-5 mx-auto flex h-18 w-18 items-center justify-center rounded-xl border"
          style={{ borderColor: 'oklch(0.62 0.22 250 / 0.26)' }}
        >
          <BrandMark size={48} className="text-accent" />
        </div>
        <h1 className="text-display text-foreground mb-s-3 font-black tracking-tight">Bandage</h1>
        <p className="text-foreground-sub mb-s-10 text-subtitle mx-auto max-w-[280px] leading-relaxed">
          {BRAND_TAGLINE}
        </p>
        <ul className="gap-s-3 flex flex-wrap justify-center">
          {BRAND_FEATURES.map((f) => (
            <li
              key={f}
              className="bg-card border-border text-foreground-sub gap-s-2 rounded-pill px-s-4 py-s-2 text-caption flex items-center border"
            >
              <Check className="text-accent h-3.5 w-3.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/**
 * Auth 화면 우측 폼 패널.
 * - lg 이상: 480px 고정 폭, 중앙 정렬 inner(max-w 360)
 * - lg 미만: 전체 너비, 중앙 정렬 inner
 */
export function AuthFormPanel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        'bg-surface px-s-4 py-s-10 flex w-full flex-col items-center justify-center lg:w-[480px] lg:flex-none lg:px-15',
        className,
      )}
      data-slot="auth-form-panel"
      {...props}
    >
      <div className="w-full max-w-[360px]">{children}</div>
    </section>
  );
}

/**
 * Auth 전체 shell: 좌측 브랜드(>=lg) + 우측 폼.
 */
export function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <div
      className="bg-bg flex min-h-screen w-full lg:h-screen lg:overflow-hidden"
      data-slot="auth-split"
    >
      <HeroCinematic />
      <AuthFormPanel>{children}</AuthFormPanel>
    </div>
  );
}
