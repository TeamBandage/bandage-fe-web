export interface CreateBandRequest {
  name: string;
  description?: string;
}

export type BandApplicationDecision = 'APPROVED' | 'REJECTED';
