import { apiClient } from '@/global/api/apiClient';

/**
 * API_REQUIRED FE-API-009 (P2 활성화) — 멀티파트 또는 사전서명 URL.
 * 본 라운드는 stub — 실제 업로드 엔드포인트가 추가되면 multipart 호출로 교체.
 */
export async function uploadBandProfileImage(
  bandId: string,
  // 향후 multipart 변환 — 현재는 placeholder.
  _file: File, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ profileImg: string }> {
  // 백엔드 미지원 — apiClient 가 404/501 등으로 throw 하도록 형태만 갖춤.
  const data = await apiClient.post<{ profileImg: string }>(
    `/api/v1/bands/${bandId}/profile-image`,
    {},
  );
  if (!data) throw new Error('프로필 이미지 업로드 응답이 비어 있습니다.');
  return data;
}
