export interface JoinRequest {
  email: string;
  password: string;
  name: string;
  contact: string;
}

export interface UpdateMeRequest {
  name?: string;
  contact?: string;
  /** presigned URL 업로드 후 받은 objectKey 또는 그대로의 CloudFront URL. */
  profileImg?: string;
}
