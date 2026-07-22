export type NotifyCategory =
  | 'BAND_APPLICATION'
  | 'BAND_APPLICATION_RESULT'
  | 'AUTHORITY_PROMOTION'
  | 'JAM_UPCOMING'
  | 'JAM_PARTICIPANT_ADDED'
  | 'JAM_CREATED'
  | 'PERFORMANCE_UPCOMING'
  | 'PERFORMANCE_MANAGER_INVITED'
  | 'PERFORMANCE_OWNER_PROMOTED'
  | 'SELECTION_PARTICIPANT_ADDED'
  | 'SETLIST_CREATED'
  | (string & {});

export interface NotificationResponse {
  id: string;
  category: NotifyCategory;
  title: string;
  message: string;
  referenceId: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadNotificationCountResponse {
  count: number;
}
