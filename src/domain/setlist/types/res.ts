export interface SetlistResponse {
  setlistId: string;
  title: string;
  trackSelectionId: string;
  managerId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetlistTrackSessionResponse {
  sessionId: string;
  label: string;
  short: string;
  need: number;
  custom: boolean;
  participants: number[];
}

export interface SetlistTrackResponse {
  setlistTrackId: string;
  setlistId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  sessions: SetlistTrackSessionResponse[];
  createdAt?: string;
  updatedAt?: string;
}
