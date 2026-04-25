/**
 * 멤버 표시명을 일관된 규칙으로 반환한다.
 * - name 이 있으면 그대로 사용
 * - 없으면 "멤버 #{memberId 마지막 4자리}" 폴백
 *
 * UUID 전체나 긴 숫자 ID 가 화면에 노출되지 않도록 하기 위한 단일 진입점.
 * 백엔드가 `name` 을 응답에 포함하면 자동으로 정상화된다 (API_REQUIRED.md FE-API-012/013).
 */
export function getMemberDisplayName(member: {
  memberId: string | number;
  name?: string | null;
}): string {
  const trimmed = member.name?.trim();
  if (trimmed) return trimmed;
  const id = String(member.memberId);
  const tail = id.slice(-4);
  return `멤버 #${tail || id}`;
}
