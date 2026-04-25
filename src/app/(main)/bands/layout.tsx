import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { BandsListPane } from './BandsListPane.client';

/**
 * Bands 라우트 레이아웃.
 * - lg 이상: 좌측 BandsListPane (360px) + 우측 children. 실질적 master-detail.
 * - lg 미만: BandsListPane 은 hidden, children 만 노출 (페이지 자체가 리스트/상세 역할 수행).
 *
 * BandsListPane 내부에서 useSearchParams() 를 사용하므로 Suspense 경계 필요.
 */
export default function BandsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col lg:h-[calc(100vh-0px)] lg:flex-row">
      <Suspense fallback={null}>
        <BandsListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
