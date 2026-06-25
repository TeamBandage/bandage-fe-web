import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { JamDetailContent } from './JamDetailContent.client';

export const metadata: Metadata = {
  title: '합주 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ jamId: string }>;
};

export default async function JamDetailPage({ params }: PageProps) {
  const { jamId } = await params;
  return (
    <>
      <div className="py-3 pr-5 pl-2 lg:pr-8 lg:pl-4">
        <Link
          href={ROUTES.JAMS}
          className="text-foreground-sub hover:text-foreground inline-flex items-center gap-1 text-sm no-underline transition-colors"
        >
          ← 합주 목록
        </Link>
      </div>
      <div className="px-5 py-4 lg:px-8 lg:py-6">
        <JamDetailContent jamId={jamId} />
      </div>
    </>
  );
}
