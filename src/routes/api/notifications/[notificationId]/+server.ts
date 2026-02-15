// PATCH /api/notifications/:notificationId — Mark single notification as read

import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error } = await supabase
		.from('notifications')
		.update({ is_read: true, read_at: new Date().toISOString() })
		.eq('id', params.notificationId)
		.eq('user_id', user.id)
		.select()
		.single();

	if (error || !data) {
		return apiError(404, 'NOT_FOUND', 'Notificatie niet gevonden');
	}

	return apiSuccess(data);
};
