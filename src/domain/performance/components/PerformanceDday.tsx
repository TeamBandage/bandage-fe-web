import { Badge } from '@/components/ui/badge';
import { parseKst } from '@/lib/date';

export function PerformanceDday({ startAt }: { startAt: string }) {
  let days: number;
  try {
    const now = new Date();
    const target = parseKst(startAt);
    days = Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }

  if (days < 0) return <Badge variant="default">종료</Badge>;
  if (days === 0) return <Badge variant="danger">D-DAY</Badge>;
  if (days <= 7) return <Badge variant="danger">D-{days}</Badge>;
  if (days <= 14) return <Badge variant="warn">D-{days}</Badge>;
  return <Badge variant="default">D-{days}</Badge>;
}
