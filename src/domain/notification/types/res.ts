export type NotifyCategory =
  | 'BAND_APPLICATION'
  | 'BAND_APPLICATION_RESULT'
  | 'AUTHORITY_PROMOTION'
  | 'JAM_UPCOMING'
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
