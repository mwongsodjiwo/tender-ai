// GET /api/notifications/preferences — List user notification preferences
// PUT /api/notifications/preferences — Update a preference

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateNotificationPreferenceSchema } from '$server/api/validation';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error } = await supabase
		.from('notification_preferences')
		.select('*')
		.eq('user_id', user.id)
		.order('notification_type');

	if (error) {
		return json({ message: error.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: data ?? [] });
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateNotificationPreferenceSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json(
			{ message: 'Voorkeur niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	return json({ data });
};
