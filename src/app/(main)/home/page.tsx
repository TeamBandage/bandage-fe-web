import type { Metadata } from 'next';
import Link from 'next/link';

import { SectionTitle } from '@/components/ui/section-title';
import { MyBands } from '@/domain/band/components/MyBands';
import { UpcomingPerformances } from '@/domain/performance/components/UpcomingPerformances';
import { UpcomingPractices } from '@/domain/practice/components/UpcomingPractices';
import { ROUTES } from '@/global/config/routes';

import { HomeGreeting } from './HomeGreeting.client';
import { HomeStatCards } from './HomeStatCards.client';

export const metadata: Metadata = {
  title: '홈 | Bandage',
};

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-accent hover:text-accent-hi text-micro font-semibold no-underline hover:no-underline"
      aria-label={label}
    >
      전체 보기 →
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-s-8 lg:p-s-10 lg:w-full">
      <HomeGreeting />

      <HomeStatCards />

      <div className="gap-s-6 grid grid-cols-1 lg:grid-cols-2">
        <section aria-labelledby="home-my-bands">
          <SectionTitle
            title="내 밴드"
            action={<ViewAllLink href={ROUTES.BANDS} label="전체 밴드 보기" />}
          />
          <MyBands limit={3} />
        </section>
        <section aria-labelledby="home-upcoming-practices">
          <SectionTitle
            title="다가오는 합주"
            action={<ViewAllLink href={ROUTES.PRACTICES} label="전체 합주 보기" />}
          />
          <UpcomingPractices limit={3} />
        </section>
      </div>

      <section aria-labelledby="home-upcoming-performances">
        <SectionTitle
          title="다가오는 공연"
          action={<ViewAllLink href={ROUTES.PERFORMANCES} label="전체 공연 보기" />}
        />
        <UpcomingPerformances limit={3} />
      </section>
    </div>
  );
}
