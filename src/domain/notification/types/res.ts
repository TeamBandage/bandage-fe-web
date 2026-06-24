export type NotificationType = string;

export interface NotificationResponse {
  notificationId: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadNotificationCountResponse {
  count: number;
}
