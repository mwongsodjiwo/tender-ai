// GET /api/notifications — List notifications for current user
// PATCH /api/notifications — Mark notifications as read

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationListQuerySchema, markNotificationsReadSchema } from '$server/api/validation';
import { markAsRead, markAllAsRead, getUnreadCount } from '$server/notifications/notification-service';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const queryParams = Object.fromEntries(url.searchParams.entries());
	const parsed = notificationListQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: error.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	const unreadCount = await getUnreadCount(supabase, user.id);

	return json({
		data: {
			notifications: data ?? [],
			unread_count: unreadCount,
			total: count ?? 0
		}
	});
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();

	if (body.mark_all_read) {
		const count = await markAllAsRead(supabase, user.id);
		return json({ data: { marked_read: count } });
	}

	const parsed = markNotificationsReadSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const count = await markAsRead(supabase, user.id, parsed.data.notification_ids);

	return json({ data: { marked_read: count } });
};
