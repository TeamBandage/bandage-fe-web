import { ApiError } from '@/global/error/ApiError';

/**
 * S3 presigned URL 에 직접 PUT.
 * apiClient 를 거치지 않는다 — 외부 호스트, Authorization 불필요, JSON 응답 래퍼 없음.
 * Content-Type 은 presign 발급 시 합의된 값과 정확히 일치해야 시그니처 검증을 통과한다.
 */
export async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  } catch {
    throw new ApiError('S3_UPLOAD_NETWORK_ERROR', '업로드 중 네트워크 오류가 발생했습니다.', 0);
  }
  if (!response.ok) {
    throw new ApiError(
      'S3_UPLOAD_FAILED',
      `이미지 업로드에 실패했습니다 (HTTP ${response.status}).`,
      response.status,
    );
  }
}
