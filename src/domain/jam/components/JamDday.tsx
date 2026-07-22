import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { Badge } from '@/components/ui/badge';
import { KST, parseKst } from '@/lib/date';

export function JamDday({ startAt }: { startAt: string }) {
  let days: number;
  try {
    const now = toZonedTime(new Date(), KST);
    const target = toZonedTime(parseKst(startAt), KST);
    days = differenceInCalendarDays(target, now);
  } catch {
    return null;
  }

  if (days < 0) return <Badge variant="default">종료</Badge>;
  if (days === 0) return <Badge variant="danger">D-DAY</Badge>;
  if (days <= 7) return <Badge variant="danger">D-{days}</Badge>;
  if (days <= 14) return <Badge variant="warn">D-{days}</Badge>;
  return <Badge variant="default">D-{days}</Badge>;
}
