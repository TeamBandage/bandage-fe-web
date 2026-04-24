export interface CreateBandRequest {
  name: string;
  description?: string;
  profileImg?: string;
}

export type BandApplicationDecision = 'APPROVED' | 'REJECTED';
