import { redirect } from 'next/navigation';

import { SEED_MEETINGS } from '@/domain/setlist-meeting/mock/seed';
import { ROUTES } from '@/global/config/routes';

/** /setlist-meetings/scheduling — 첫 회의로 자동 redirect. 빈 회의일 경우 안내. */
export default function SchedulingIndexPage() {
  const first = SEED_MEETINGS[0];
  if (first) redirect(ROUTES.SETLIST_SCHEDULING_DETAIL(first.id));
  return (
    <div className="px-s-5 py-s-6">
      <p className="text-foreground-muted text-caption">
        조율할 선곡 회의가 없습니다. 먼저 회의를 만들어주세요.
      </p>
    </div>
  );
}
