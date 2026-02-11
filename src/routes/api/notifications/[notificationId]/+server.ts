// PATCH /api/notifications/:notificationId — Mark single notification as read

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error } = await supabase
		.from('notifications')
		.update({ is_read: true, read_at: new Date().toISOString() })
		.eq('id', params.notificationId)
		.eq('user_id', user.id)
		.select()
		.single();

	if (error || !data) {
		return json(
			{ message: 'Notificatie niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	return json({ data });
};
