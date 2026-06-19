import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { SectionTitle } from '@/components/ui/section-title';
import { MyBands } from '@/domain/band/components/MyBands';
import { UpcomingPerformances } from '@/domain/performance/components/UpcomingPerformances';
import { UpcomingJams } from '@/domain/jam/components/UpcomingJams';
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
      aria-label={label}
      className="group inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors ![text-decoration:none] hover:bg-white hover:text-black"
    >
      <span>전체 보기</span>
      <ArrowUpRight
        className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-s-8 lg:p-s-10 lg:w-full">
      <HomeGreeting />

      <HomeStatCards />

      <div className="gap-s-6 grid grid-cols-1 lg:grid-cols-2">
        <section aria-labelledby="home-my-bands" className="flex flex-col">
          <SectionTitle title="내 밴드" />
          <MyBands limit={3} />
          <div className="pt-s-2 mt-auto flex justify-end">
            <ViewAllLink href={ROUTES.BANDS} label="전체 밴드 보기" />
          </div>
        </section>
        <section aria-labelledby="home-upcoming-practices" className="flex flex-col">
          <SectionTitle title="다가오는 합주" />
          <UpcomingJams limit={3} />
          <div className="pt-s-2 mt-auto flex justify-end">
            <ViewAllLink href={ROUTES.JAMS} label="전체 합주 보기" />
          </div>
        </section>
      </div>

      <section aria-labelledby="home-upcoming-performances">
        <SectionTitle title="다가오는 공연" />
        <UpcomingPerformances limit={3} />
        <div className="mt-s-2 flex justify-end">
          <ViewAllLink href={ROUTES.PERFORMANCES} label="전체 공연 보기" />
        </div>
      </section>
    </div>
  );
}
