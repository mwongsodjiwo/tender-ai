// GET /api/notifications — List notifications for current user
// PATCH /api/notifications — Mark notifications as read

import type { RequestHandler } from './$types';
import { notificationListQuerySchema, markNotificationsReadSchema } from '$server/api/validation';
import { markAsRead, markAllAsRead, getUnreadCount } from '$server/notifications/notification-service';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const queryParams = Object.fromEntries(url.searchParams.entries());
	const parsed = notificationListQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	let query = supabase
		.from('notifications')
		.select('*', { count: 'exact' })
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

	if (parsed.data.unread_only) {
		query = query.eq('is_read', false);
	}
	if (parsed.data.project_id) {
		query = query.eq('project_id', parsed.data.project_id);
	}
	if (parsed.data.notification_type) {
		query = query.eq('notification_type', parsed.data.notification_type);
	}

	const { data, count, error } = await query;

	if (error) {
		return apiError(500, 'DB_ERROR', error.message);
	}

	const unreadCount = await getUnreadCount(supabase, user.id);

	return apiSuccess({
		notifications: data ?? [],
		unread_count: unreadCount,
		total: count ?? 0
	});
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();

	if (body.mark_all_read) {
		const count = await markAllAsRead(supabase, user.id);
		return apiSuccess({ marked_read: count });
	}

	const parsed = markNotificationsReadSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const count = await markAsRead(supabase, user.id, parsed.data.notification_ids);

	return apiSuccess({ marked_read: count });
};
