export type UploadDomain = 'MEMBER' | 'BAND';

export interface ProfileImagePresignRequest {
  domain: UploadDomain;
  /** domain=BAND 인 경우 필수. 매니저 권한 검증 대상. */
  bandId?: string;
  contentType: string;
  /** 점 제외, 소문자. */
  ext: string;
}

export interface ProfileImagePresignResponse {
  /** PUT 업로드용 presigned URL. */
  uploadUrl: string;
  /** 업로드 후 PATCH 시 profileImg 필드에 저장할 객체 키. */
  objectKey: string;
  expiresInSeconds: number;
}
