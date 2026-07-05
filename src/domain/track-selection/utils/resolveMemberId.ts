/**
 * BE가 참여자/채팅 응답의 최상위 memberId 필드를 member.memberId 로 이관 중이라
 * 과도기 호환을 위해 둘 다 확인한다.
 */
export function resolveMemberId(entity: {
  memberId?: number;
  member?: { memberId: number };
}): number | undefined {
  return entity.member?.memberId ?? entity.memberId;
}
