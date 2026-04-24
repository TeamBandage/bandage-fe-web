'use client';

import { Music, Unlink } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useRemovePerformancePractice } from '@/domain/performance/hooks/useRemovePerformancePractice';
import { useIsPerformanceManager } from '@/global/auth/useIsPerformanceManager';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

type Props = {
  performanceId: string;
  practiceId: string;
};

export function PerformancePracticeRow({ performanceId, practiceId }: Props) {
  const toast = useToast();
  const { isManager } = useIsPerformanceManager(performanceId);
  const mutation = useRemovePerformancePractice(performanceId, {
    onSuccess: () => toast.success('합주 연결을 해제했습니다.'),
    onError: (err) => toast.error(err.message || '연결 해제에 실패했습니다.'),
  });

  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <Link
        href={ROUTES.PRACTICE_DETAIL(practiceId)}
        className="text-foreground inline-flex min-w-0 items-center gap-2 text-sm hover:underline"
      >
        <Music className="text-foreground-muted h-4 w-4" aria-hidden="true" />
        <span className="truncate">{practiceId}</span>
      </Link>
      {isManager && (
        <Button
          size="sm"
          variant="ghost"
          className="text-danger hover:opacity-80"
          onClick={() => mutation.mutate(practiceId)}
          loading={mutation.isPending}
        >
          <Unlink className="h-4 w-4" />
          해제
        </Button>
      )}
    </div>
  );
}
