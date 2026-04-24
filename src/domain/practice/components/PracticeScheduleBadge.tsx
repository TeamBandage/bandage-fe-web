import { Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { parseKst, formatKst } from '@/lib/date';

type Props = {
  startAt: string;
  durationMinutes: number;
};

export function PracticeScheduleBadge({ startAt, durationMinutes }: Props) {
  let label = startAt;
  try {
    label = formatKst(parseKst(startAt), 'M월 d일 HH:mm');
  } catch {
    // fallback to raw string
  }
  return (
    <Badge variant="accent">
      <Calendar className="mr-1 h-3 w-3" aria-hidden="true" />
      {label} ({durationMinutes}분)
    </Badge>
  );
}
