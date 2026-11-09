export type NotificationType =
  | "event_cancelled"
  | "event_reminder_24h"
  | "event_reminder_12h"
  | "event_reminder_1h"
  | "appeal_submitted"
  | "appeal_approved"
  | "appeal_rejected"
  | "account_unbanned";

export interface NotificationItem {
  _id: string;
  userEmail: string;
  userName?: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  eventDate?: string | Date;
  eventLocation?: string;
  eventThumbnail?: string;
  cancellationReason?: string;
  organizerName?: string;
  organizerEmail?: string;
  isRead: boolean;
  createdAt: string | Date;
}
