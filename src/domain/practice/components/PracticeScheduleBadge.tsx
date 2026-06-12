import { Calendar } from 'lucide-react';

import { parseKst, formatKst } from '@/lib/date';

type Props = {
  startAt: string;
  durationMinutes: number;
};

export function PracticeScheduleBadge({ startAt, durationMinutes }: Props) {
  let label = startAt;
  try {
    label = formatKst(parseKst(startAt), 'M월 d일 (EEE) HH:mm');
  } catch {
    // fallback to raw string
  }
  return (
    <span className="text-foreground-sub inline-flex items-center gap-1 rounded bg-white/8 px-1.5 py-0.5">
      <Calendar className="h-3 w-3" aria-hidden="true" />
      {label} ({durationMinutes}분)
    </span>
  );
}
