export type UploadDomain = 'MEMBER' | 'BAND';

export interface MemberProfileImagePresignRequest {
  contentType: string;
  ext: string;
  contentLength: number;
}

export interface BandProfileImagePresignRequest {
  bandId: string;
  contentType: string;
  ext: string;
  contentLength: number;
}

/** @deprecated Use MemberProfileImagePresignRequest or BandProfileImagePresignRequest */
export type ProfileImagePresignRequest =
  | MemberProfileImagePresignRequest
  | BandProfileImagePresignRequest;

export interface ProfileImagePresignResponse {
  /** PUT 업로드용 presigned URL. */
  uploadUrl: string;
  /** 업로드 후 PATCH 시 profileImg 필드에 저장할 객체 키. */
  objectKey: string;
  expiresInSeconds: number;
}
