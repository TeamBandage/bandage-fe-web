'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/feedback/error-state';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <ErrorState
        title="화면을 준비하지 못했어요"
        description="잠시 후 다시 시도하거나 다른 메뉴를 이용해 주세요."
        onRetry={reset}
        className="w-full max-w-md"
      />
    </div>
  );
}
