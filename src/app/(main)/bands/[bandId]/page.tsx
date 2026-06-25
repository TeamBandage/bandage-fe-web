import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { BandDetailContent } from './BandDetailContent.client';

export const metadata: Metadata = {
  title: '밴드 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ bandId: string }>;
};

export default async function BandDetailPage({ params }: PageProps) {
  const { bandId } = await params;
  return (
    <>
      <div className="py-3 pr-5 pl-2 lg:pr-8 lg:pl-4">
        <Link
          href={ROUTES.BANDS}
          className="text-foreground-sub hover:text-foreground inline-flex items-center gap-1 text-sm no-underline transition-colors"
        >
          ← 밴드 목록
        </Link>
      </div>
      <BandDetailContent bandId={bandId} />
    </>
  );
}
