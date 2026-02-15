// Notification API types

import type { Notification, NotificationPreference } from '../database.js';
import type { NotificationType } from '../enums.js';

export interface NotificationListQuery {
	unread_only?: boolean;
	project_id?: string;
	notification_type?: NotificationType;
	limit?: number;
	offset?: number;
}

export interface NotificationListResponse {
	notifications: Notification[];
	unread_count: number;
	total: number;
}

export interface MarkNotificationsReadRequest {
	notification_ids: string[];
}

export interface UpdateNotificationPreferenceRequest {
	notification_type: NotificationType;
	in_app?: boolean;
	email?: boolean;
	days_before_deadline?: number;
}

export type NotificationPreferenceListResponse = NotificationPreference[];
