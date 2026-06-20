'use client';

import { Music } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { pickUpcoming } from '@/lib/home-feed';

import { useUpcomingJams } from '../hooks/useUpcomingJams';
import type { JamListItemResponse } from '../types';

import { JamCard } from './JamCard';

// [BD-90] MOCK_MODE — UI 확인용, 실제 연동 후 제거
const MOCK_MODE = true;
const MOCK_PRACTICES: JamListItemResponse[] = [
  {
    jamId: '1',
    title: '6월 정기 합주',
    startAt: '2026-06-14 15:00',
    durationMinutes: 120,
    venue: '홍대 스튜디오 A',
  },
  {
    jamId: '2',
    title: '공연 준비 합주',
    startAt: '2026-06-18 19:00',
    durationMinutes: 180,
    venue: '강남 연습실',
  },
  {
    jamId: '3',
    title: '신곡 연습',
    startAt: '2026-06-22 14:00',
    durationMinutes: 90,
  },
];

export function UpcomingJams({ limit = 3 }: { limit?: number }) {
  // limit+1 fetch 로 hasMore 판정. 백엔드 정렬은 ID 기준이라 본인 파일에서 startAt asc 재정렬 + 과거 제외.
  const { data, isLoading, isError, refetch } = useUpcomingJams(limit + 1);

  if (MOCK_MODE) {
    return (
      <div className="space-y-3">
        {MOCK_PRACTICES.slice(0, limit).map((p) => (
          <JamCard key={p.jamId} practice={p} />
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" rounded="md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState description="가까운 합주를 불러오지 못했습니다." onRetry={() => refetch()} />
    );
  }

  const { items } = pickUpcoming(data ?? [], limit);
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="예정된 합주가 없습니다"
        description="합주 탭에서 첫 합주를 만들어 보세요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <JamCard key={p.jamId} practice={p} />
      ))}
    </div>
  );
}
