import { Guitar } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/global/config/routes';

const TAGLINE =
  '밴드 합주 일정, 세션 편성, 공연까지 — 한 곳에서 관리하고 흩어진 연락을 하나로 모으세요.';

/**
 * 온보딩 Hero.
 * AuthBrand 와 시각 언어를 공유하되 (gradient + rings + 72px 로고 + text-display 타이틀),
 * 랜딩 전용 CTA([시작하기]/[이미 계정이 있어요]) 와 중앙 정렬 레이아웃을 가진다.
 */
export function OnboardingHero() {
  return (
    <section
      className="border-border px-s-4 py-s-12 relative overflow-hidden border-b lg:py-20"
      style={{ backgroundImage: 'var(--gradient-auth-brand)' }}
      data-slot="onboarding-hero"
      aria-labelledby="onboarding-hero-title"
    >
      {/* Decorative rings */}
      <div
        className="pt-s-12 pointer-events-none absolute inset-0 flex items-start justify-center"
        aria-hidden="true"
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 560,
            height: 560,
            top: '-10%',
            border: '1px solid oklch(0.62 0.22 250 / 0.12)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 380,
            height: 380,
            top: '0%',
            border: '1px solid oklch(0.62 0.22 250 / 0.15)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            top: '6%',
            background: 'oklch(0.62 0.22 250 / 0.06)',
          }}
        />
      </div>

      <div className="relative z-[1] mx-auto flex max-w-2xl flex-col items-center text-center">
        <div
          className="bg-accent-dim mb-s-5 flex h-18 w-18 items-center justify-center rounded-xl border"
          style={{ borderColor: 'oklch(0.62 0.22 250 / 0.26)' }}
          aria-hidden="true"
        >
          <Guitar className="text-accent h-9 w-9" />
        </div>
        <h1
          id="onboarding-hero-title"
          className="text-display text-foreground mb-s-3 font-black tracking-tight"
        >
          Bandage
        </h1>
        <p className="text-foreground-sub mb-s-8 text-subtitle max-w-[480px] leading-relaxed">
          {TAGLINE}
        </p>
        <div
          className="gap-s-3 flex w-full flex-col sm:flex-row sm:justify-center"
          data-slot="onboarding-cta"
        >
          <Button asChild size="lg" className="sm:min-w-[180px]">
            <Link href={ROUTES.JOIN}>시작하기</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="sm:min-w-[180px]">
            <Link href={ROUTES.LOGIN}>이미 계정이 있어요</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
