import { apiClient } from '@/global/api/apiClient';

import type { ProfileImagePresignRequest, ProfileImagePresignResponse } from './types';

/** BE: `POST /api/v1/uploads/profile-image/presigned-url`. */
export async function presignProfileImage(
  req: ProfileImagePresignRequest,
): Promise<ProfileImagePresignResponse> {
  const data = await apiClient.post<ProfileImagePresignResponse>(
    '/api/v1/uploads/profile-image/presigned-url',
    req,
  );
  if (!data) throw new Error('presigned URL 응답이 비어 있습니다.');
  return data;
}
