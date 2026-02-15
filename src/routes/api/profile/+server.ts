// GET /api/profile — Get current user profile
// PATCH /api/profile — Update current user profile

import type { RequestHandler } from './$types';
import { updateProfileSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Profiel niet gevonden');
	}

	return apiSuccess(data);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateProfileSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('profiles')
		.update(parsed.data)
		.eq('id', user.id)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'profile',
		entityId: user.id,
		changes: parsed.data
	});

	return apiSuccess(data);
};
