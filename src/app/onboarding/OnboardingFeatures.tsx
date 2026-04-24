import { CalendarClock, Music4, Sparkles, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: 'accent' | 'success' | 'amber';
};

const FEATURES: Feature[] = [
  {
    icon: CalendarClock,
    title: '합주 일정 관리',
    description: '흩어진 일정·장소·연락을 하나의 합주 카드로 묶어 공유하세요.',
    accent: 'accent',
  },
  {
    icon: Music4,
    title: '세션 편성',
    description: '보컬·기타·베이스 등 세션 배정을 드래그 없이 한 번의 클릭으로.',
    accent: 'success',
  },
  {
    icon: Sparkles,
    title: '공연 연결',
    description: '공연 하나를 목표로 여러 합주를 이정표처럼 엮어 진행도를 추적하세요.',
    accent: 'amber',
  },
];

const ICON_BG: Record<Feature['accent'], string> = {
  accent: 'bg-accent-dim text-accent',
  success: 'bg-success-dim text-success',
  amber: 'bg-amber-dim text-amber',
};

/**
 * 온보딩 Features.
 * Home 의 3대 축(합주 / 세션 / 공연) 을 1:1 대응.
 * 모바일: 단일 column. md 이상: 3열 grid.
 */
export function OnboardingFeatures() {
  return (
    <section
      className="px-s-4 py-s-12 lg:py-16"
      data-slot="onboarding-features"
      aria-labelledby="onboarding-features-title"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="onboarding-features-title"
          className="text-foreground mb-s-8 text-title-lg text-center font-bold"
        >
          Bandage 가 해결하는 3가지
        </h2>
        <ul className="gap-s-4 md:gap-s-5 grid grid-cols-1 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, accent }) => (
            <li
              key={title}
              className="bg-card border-border p-s-6 rounded-lg border"
              data-feature={title}
            >
              <div
                className={cn(
                  'mb-s-4 flex h-12 w-12 items-center justify-center rounded-md',
                  ICON_BG[accent],
                )}
                aria-hidden="true"
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-foreground text-subtitle mb-s-2 font-bold">{title}</h3>
              <p className="text-foreground-sub text-body leading-relaxed">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
