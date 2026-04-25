'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';

export function HomeGreeting() {
  const { data: me, isLoading } = useMe();

  return (
    <header className="space-y-s-1" data-slot="home-greeting">
      {isLoading ? (
        <Skeleton className="h-8 w-64" rounded="md" />
      ) : (
        <h1 className="text-foreground text-title-lg font-extrabold">
          {me?.name ? `안녕하세요, ${me.name} 님 👋` : '안녕하세요 👋'}
        </h1>
      )}
      <p className="text-foreground-sub text-body">오늘도 좋은 합주 되세요.</p>
    </header>
  );
}
