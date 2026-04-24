import type { Metadata } from 'next';

import { PageTitle } from '@/components/layout/page-title';
import { MyBands } from '@/domain/band/components/MyBands';
import { UpcomingPerformances } from '@/domain/performance/components/UpcomingPerformances';
import { UpcomingPractices } from '@/domain/practice/components/UpcomingPractices';

export const metadata: Metadata = {
  title: '홈 | Bandage',
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      <PageTitle title="홈" description="오늘의 합주와 공연을 한눈에 확인하세요." />

      <section aria-labelledby="home-upcoming-practices" className="space-y-3">
        <h2 id="home-upcoming-practices" className="text-foreground text-base font-semibold">
          가까운 합주
        </h2>
        <UpcomingPractices limit={3} />
      </section>

      <section aria-labelledby="home-my-bands" className="space-y-3">
        <h2 id="home-my-bands" className="text-foreground text-base font-semibold">
          내 밴드
        </h2>
        <MyBands limit={6} />
      </section>

      <section aria-labelledby="home-upcoming-performances" className="space-y-3">
        <h2 id="home-upcoming-performances" className="text-foreground text-base font-semibold">
          예정 공연
        </h2>
        <UpcomingPerformances limit={2} />
      </section>
    </div>
  );
}
