import { apiClient } from '@/global/api/apiClient';

import type {
  BandProfileImagePresignRequest,
  MemberProfileImagePresignRequest,
  ProfileImagePresignResponse,
} from './types';

/** `POST /api/v1/members/me/profile-image/presigned-url` */
export async function presignMemberProfileImage(
  req: MemberProfileImagePresignRequest,
): Promise<ProfileImagePresignResponse> {
  const data = await apiClient.post<ProfileImagePresignResponse>(
    '/api/v1/members/me/profile-image/presigned-url',
    req,
  );
  if (!data) throw new Error('presigned URL 응답이 비어 있습니다.');
  return data;
}

/** `POST /api/v1/bands/{bandId}/profile-image/presigned-url` (밴드 이미지 전용) */
export async function presignBandProfileImage(
  req: BandProfileImagePresignRequest,
): Promise<ProfileImagePresignResponse> {
  const { bandId, ...body } = req;
  const data = await apiClient.post<ProfileImagePresignResponse>(
    `/api/v1/bands/${bandId}/profile-image/presigned-url`,
    body,
  );
  if (!data) throw new Error('presigned URL 응답이 비어 있습니다.');
  return data;
}

/** @deprecated Use presignMemberProfileImage or presignBandProfileImage */
export async function presignProfileImage(
  req: MemberProfileImagePresignRequest | BandProfileImagePresignRequest,
): Promise<ProfileImagePresignResponse> {
  if ('bandId' in req) {
    return presignBandProfileImage(req as BandProfileImagePresignRequest);
  }
  return presignMemberProfileImage(req as MemberProfileImagePresignRequest);
}
