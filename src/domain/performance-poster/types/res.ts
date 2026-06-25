export interface PerformancePosterResponse {
  posterId: string;
  performanceId: string;
  imageUrl: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformancePosterPresignResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}
