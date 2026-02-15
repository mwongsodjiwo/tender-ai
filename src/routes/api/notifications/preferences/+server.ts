// GET /api/notifications/preferences — List user notification preferences
// PUT /api/notifications/preferences — Update a preference

import type { RequestHandler } from './$types';
import { updateNotificationPreferenceSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error } = await supabase
		.from('notification_preferences')
		.select('*')
		.eq('user_id', user.id)
		.order('notification_type');

	if (error) {
		return apiError(500, 'DB_ERROR', error.message);
	}

	return apiSuccess(data ?? []);
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateNotificationPreferenceSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateFields: Record<string, unknown> = {};
	if (parsed.data.in_app !== undefined) updateFields.in_app = parsed.data.in_app;
	if (parsed.data.email !== undefined) updateFields.email = parsed.data.email;
	if (parsed.data.days_before_deadline !== undefined) {
		updateFields.days_before_deadline = parsed.data.days_before_deadline;
	}

	const { data, error } = await supabase
		.from('notification_preferences')
		.update(updateFields)
		.eq('user_id', user.id)
		.eq('notification_type', parsed.data.notification_type)
		.select()
		.single();

	if (error || !data) {
		return apiError(404, 'NOT_FOUND', 'Voorkeur niet gevonden');
	}

	return apiSuccess(data);
};
