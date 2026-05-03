export type UploadDomain = 'MEMBER' | 'BAND';

export interface ProfileImagePresignRequest {
  domain: UploadDomain;
  /** domain=BAND 인 경우 필수. 매니저 권한 검증 대상. */
  bandId?: string;
  contentType: string;
  /** 점 제외, 소문자. */
  ext: string;
  /**
   * 업로드할 파일의 정확한 바이트 크기 (1 ~ 5,242,880).
   * BE 가 contentLength 를 시그니처에 포함하므로 PUT body 크기와 정확히 일치해야 한다.
   */
  contentLength: number;
}

export interface ProfileImagePresignResponse {
  /** PUT 업로드용 presigned URL. */
  uploadUrl: string;
  /** 업로드 후 PATCH 시 profileImg 필드에 저장할 객체 키. */
  objectKey: string;
  expiresInSeconds: number;
}
