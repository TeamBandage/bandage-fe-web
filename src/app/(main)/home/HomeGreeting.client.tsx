'use client';

import { BrandWordmark } from '@/components/brand';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';

export function HomeGreeting() {
  const { data: me, isLoading } = useMe();

  return (
    <header className="space-y-s-6 pt-s-2 lg:pt-s-4" data-slot="home-greeting">
      <div className="space-y-s-3">
        <BrandWordmark size="lg" title="Bandage" className="text-accent lg:hidden" />
        <BrandWordmark size="xl" title="Bandage" className="text-accent hidden lg:inline-flex" />
        <p className="text-foreground-sub text-subtitle max-w-md leading-relaxed">
          밴드의 합주, 공연, 선곡을 한곳에서.
        </p>
      </div>

      <div className="space-y-s-1">
        {isLoading ? (
          <Skeleton className="h-7 w-64" rounded="md" />
        ) : (
          <h2 className="text-foreground text-title font-bold">
            {me?.name ? `안녕하세요, ${me.name} 님` : '안녕하세요'}
          </h2>
        )}
        <p className="text-foreground-muted text-body">오늘도 좋은 합주 되세요.</p>
      </div>
    </header>
  );
}
