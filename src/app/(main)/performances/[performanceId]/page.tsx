import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { PerformanceDetailContent } from './PerformanceDetailContent.client';

export const metadata: Metadata = {
  title: '공연 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ performanceId: string }>;
};

export default async function PerformanceDetailPage({ params }: PageProps) {
  const { performanceId } = await params;
  return (
    <>
      <div className="py-3 pr-5 pl-2 lg:pr-8 lg:pl-4">
        <Link
          href={ROUTES.PERFORMANCES}
          className="text-foreground-sub hover:text-foreground inline-flex items-center gap-1 text-sm no-underline transition-colors"
        >
          ← 공연 목록
        </Link>
      </div>
      <div className="pb-6">
        <PerformanceDetailContent performanceId={performanceId} />
      </div>
    </>
  );
}
