import { redirect } from 'next/navigation';

import { SEED_MEETINGS } from '@/domain/setlist-meeting/mock/seed';
import { ROUTES } from '@/global/config/routes';

/**
 * /setlist-meetings 진입 시 첫 번째 mock 회의로 자동 redirect.
 * 빈 상태 UX 는 layout 의 children empty fallback 에서 처리.
 */
export default function SetlistMeetingsPage() {
  const first = SEED_MEETINGS[0];
  if (first) redirect(ROUTES.SETLIST_MEETING_DETAIL(first.id));
  return null;
}
