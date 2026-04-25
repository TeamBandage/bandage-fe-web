/**
 * API_SPEC §5-1 검색 응답 항목 (외부 시스템 곡 정보 — DB 엔티티가 아닌 전송용 DTO).
 * 그대로 §5-3 `/practice-songs/from-song` 의 song 필드로 전달 가능.
 */
export interface SongSearchItem {
  title: string;
  artist: string;
  album: string;
  duration: number;
  refLink?: string | null;
}

/** API_SPEC §5-2 / §5-3 / §5-4 / §5-5 응답: DB 에 영속된 합주곡. */
export interface PracticeSongResponse {
  songId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  refLink?: string | null;
}
