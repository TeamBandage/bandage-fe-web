import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { MeetingDetail } from './MeetingDetail.client';

export const metadata: Metadata = {
  title: '선곡 회의 상세 | Bandage',
};

export default async function TrackSelectionDetailPage({
  params,
}: {
  params: Promise<{ selectionId: string }>;
}) {
  const { selectionId } = await params;
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 py-3 pr-5 pl-2 lg:pr-8 lg:pl-4">
        <Link
          href={ROUTES.TRACK_SELECTIONS}
          className="text-foreground-sub hover:text-foreground inline-flex items-center gap-1 text-sm no-underline transition-colors"
        >
          ← 선곡 목록
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <MeetingDetail meetingId={selectionId} />
      </div>
    </div>
  );
}
