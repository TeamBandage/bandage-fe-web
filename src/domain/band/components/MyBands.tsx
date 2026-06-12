'use client';

import { Users } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useMyBands } from '../hooks/useMyBands';
import type { MyBandInfoResponse } from '../types';

import { BandCard } from './BandCard';

// [BD-90] MOCK_MODE — UI 확인용, 실제 연동 후 제거
const MOCK_MODE = true;
const MOCK_BANDS: MyBandInfoResponse[] = [
  {
    bandId: '1',
    bandName: 'The Rockers',
    description: '서울 홍대 기반 인디 록 밴드',
    profileImg: 'https://picsum.photos/seed/band1/80/80',
    myRole: 'LEADER',
  },
  {
    bandId: '2',
    bandName: 'Harmonia',
    description: '재즈 팝을 주로 하는 5인조 밴드',
    myRole: 'MEMBER',
  },
  { bandId: '3', bandName: 'Blue Noise', myRole: 'ADMIN' },
];

export function MyBands({ limit = 6 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useMyBands(limit);

  if (MOCK_MODE) {
    return (
      <div className="space-y-3">
        {MOCK_BANDS.slice(0, limit).map((b) => (
          <BandCard key={b.bandId} band={b} />
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" rounded="md" />
        <Skeleton className="h-20 w-full" rounded="md" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="밴드 목록을 불러오지 못했습니다." onRetry={() => refetch()} />;
  }

  const bands = data ?? [];
  if (bands.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="가입한 밴드가 없습니다"
        description="밴드 탭에서 새 밴드를 만들거나 가입 신청을 해 보세요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {bands.map((b) => (
        <BandCard key={b.bandId} band={b} />
      ))}
    </div>
  );
}
