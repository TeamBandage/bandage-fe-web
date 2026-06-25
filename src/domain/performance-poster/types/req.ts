export interface PerformancePosterPresignRequest {
  contentType: string;
  contentLength: number;
  ext: string;
}

export interface CreatePerformancePosterRequest {
  performanceId: string;
  objectKey: string;
  description?: string;
}

export interface UpdatePerformancePosterRequest {
  description: string;
}
