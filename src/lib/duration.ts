export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;

  if (minutes === 0) return `${remainder}초`;
  if (remainder === 0) return `${minutes}분`;
  return `${minutes}분 ${remainder}초`;
}
