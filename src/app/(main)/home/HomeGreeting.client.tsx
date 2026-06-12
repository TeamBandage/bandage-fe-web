'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';

export function HomeGreeting() {
  const { data: me, isLoading } = useMe();

  return (
    <header className="pt-s-2 lg:pt-s-4" data-slot="home-greeting">
      {isLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-10 w-72" rounded="md" />
          <Skeleton className="h-10 w-56" rounded="md" />
        </div>
      ) : (
        <div>
          <h1 className="text-foreground text-2xl leading-tight font-bold lg:text-3xl">
            {me?.name ? (
              <>
                안녕하세요, <span className="text-foreground-sub">{me.name} 님</span>
              </>
            ) : (
              '안녕하세요'
            )}
          </h1>
          <p className="text-foreground-muted mt-s-1 text-sm font-medium lg:text-base">
            오늘도 좋은 합주 되세요
          </p>
        </div>
      )}
    </header>
  );
}
