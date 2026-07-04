import { extFromMime, isAllowedImageMime, MAX_IMAGE_SIZE_BYTES } from './constants';
import { presignBandProfileImage, presignMemberProfileImage } from './presignProfileImage';
import type { UploadDomain } from './types';
import { uploadToPresignedUrl } from './uploadToPresignedUrl';

export interface UploadProfileImageInput {
  file: File;
  domain: UploadDomain;
  /** domain=BAND 인 경우 필수. */
  bandId?: string;
}

/**
 * 프로필 이미지 업로드 — presign 발급 → S3 PUT → objectKey 반환.
 * 호출 측은 받은 objectKey 를 PATCH 의 `profileImg` 필드로 그대로 전달한다.
 * BE 가 응답 직렬화 시 CloudFront URL 로 변환해 돌려준다.
 */
export async function uploadProfileImage({
  file,
  domain,
  bandId,
}: UploadProfileImageInput): Promise<string> {
  if (!isAllowedImageMime(file.type)) {
    throw new Error('JPEG / PNG / WEBP 형식만 업로드할 수 있습니다.');
  }
  if (file.size <= 0) {
    throw new Error('빈 파일은 업로드할 수 없습니다.');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('이미지 크기는 5MB 이하여야 합니다.');
  }
  const ext = extFromMime(file.type);
  if (!ext) throw new Error('지원하지 않는 이미지 형식입니다.');
  if (domain === 'BAND' && !bandId) {
    throw new Error('밴드 프로필 이미지 업로드에는 bandId 가 필요합니다.');
  }

  const common = { contentType: file.type, ext, contentLength: file.size };
  const presign =
    domain === 'BAND'
      ? await presignBandProfileImage({ bandId: bandId!, ...common })
      : await presignMemberProfileImage(common);
  await uploadToPresignedUrl(presign.uploadUrl, file);
  return presign.objectKey;
}
