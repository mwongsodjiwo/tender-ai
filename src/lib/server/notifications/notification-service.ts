// Notification service — creates and manages in-app notifications

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationType } from '$types';

interface CreateNotificationParams {
	userId: string;
	organizationId: string;
	projectId?: string;
	notificationType: NotificationType;
	title: string;
	body: string;
	metadata?: Record<string, unknown>;
}

export async function createNotification(
	supabase: SupabaseClient,
	params: CreateNotificationParams
): Promise<string | null> {
	const pref = await getUserPreference(supabase, params.userId, params.notificationType);

	if (pref && !pref.in_app) {
		return null;
	}

	const { data, error } = await supabase
		.from('notifications')
		.insert({
			user_id: params.userId,
			organization_id: params.organizationId,
			project_id: params.projectId ?? null,
			notification_type: params.notificationType,
			title: params.title,
			body: params.body,
			metadata: params.metadata ?? {}
		})
		.select('id')
		.single();

	if (error) {
		return null;
	}

	return data.id;
}

export async function createBulkNotifications(
	supabase: SupabaseClient,
	notifications: CreateNotificationParams[]
): Promise<number> {
	if (notifications.length === 0) return 0;

	const rows = notifications.map((n) => ({
		user_id: n.userId,
		organization_id: n.organizationId,
		project_id: n.projectId ?? null,
		notification_type: n.notificationType,
		title: n.title,
		body: n.body,
		metadata: n.metadata ?? {}
	}));

	const { data, error } = await supabase
		.from('notifications')
		.insert(rows)
		.select('id');

	if (error) {
		return 0;
	}

	return data?.length ?? 0;
}

export async function markAsRead(
	supabase: SupabaseClient,
	userId: string,
	notificationIds: string[]
): Promise<number> {
	const { data, error } = await supabase
		.from('notifications')
		.update({ is_read: true, read_at: new Date().toISOString() })
		.eq('user_id', userId)
		.in('id', notificationIds)
		.select('id');

	if (error) {
		return 0;
	}

	return data?.length ?? 0;
}

export async function markAllAsRead(
	supabase: SupabaseClient,
	userId: string
): Promise<number> {
	const { data, error } = await supabase
		.from('notifications')
		.update({ is_read: true, read_at: new Date().toISOString() })
		.eq('user_id', userId)
		.eq('is_read', false)
		.select('id');

	if (error) {
		return 0;
	}

	return data?.length ?? 0;
}

export async function getUnreadCount(
	supabase: SupabaseClient,
	userId: string
): Promise<number> {
	const { count, error } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('is_read', false);

	if (error) {
		return 0;
	}

	return count ?? 0;
}

async function getUserPreference(
	supabase: SupabaseClient,
	userId: string,
	notificationType: NotificationType
): Promise<{ in_app: boolean; email: boolean; days_before_deadline: number } | null> {
	const { data } = await supabase
		.from('notification_preferences')
		.select('in_app, email, days_before_deadline')
		.eq('user_id', userId)
		.eq('notification_type', notificationType)
		.single();

	return data;
}
