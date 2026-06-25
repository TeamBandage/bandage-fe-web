export interface SetlistCreateRequest {
  trackSelectionId: string;
  title?: string;
}

export interface SetlistUpdateRequest {
  title: string;
}

export interface SetlistTrackUpdateRequest {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  sessions?: {
    sessionId: string;
    label: string;
    short: string;
    need: number;
    custom: boolean;
  }[];
}

export interface SetlistToJamRequest {
  startAt: string;
  durationMinutes: number;
  venue?: string;
}
