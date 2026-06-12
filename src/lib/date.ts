import { differenceInMinutes, format, isToday, isYesterday, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const KST = 'Asia/Seoul';
export const KST_FORMAT = 'yyyy-MM-dd HH:mm';

export function formatKst(date: Date, pattern: string = KST_FORMAT): string {
  return format(toZonedTime(date, KST), pattern, { locale: ko });
}

export function parseKst(dateString: string, pattern: string = KST_FORMAT): Date {
  return fromZonedTime(parse(dateString, pattern, new Date()), KST);
}

export function formatRelative(date: Date, now: Date = new Date()): string {
  const kstDate = toZonedTime(date, KST);
  const kstNow = toZonedTime(now, KST);
  const diffMinutes = differenceInMinutes(kstNow, kstDate);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  if (isToday(kstDate)) return `${Math.floor(diffMinutes / 60)}시간 전`;
  if (isYesterday(kstDate)) return '어제';

  return format(kstDate, 'yyyy-MM-dd');
}
