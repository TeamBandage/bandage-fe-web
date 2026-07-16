import { CalendarDays } from 'lucide-react';

import { parseKst, formatKst } from '@/lib/date';

type Props = {
  startAt: string;
  durationMinutes: number;
};

export function JamScheduleBadge({ startAt, durationMinutes }: Props) {
  let label = startAt;
  try {
    label = formatKst(parseKst(startAt), 'yyyy년 M월 d일 HH:mm');
  } catch {
    // fallback to raw string
  }
  return (
    <span className="text-foreground-sub inline-flex items-center gap-1 rounded bg-white/8 px-1.5 py-0.5">
      <CalendarDays className="h-3 w-3" aria-hidden="true" />
      {label} ({durationMinutes}분)
    </span>
  );
}
