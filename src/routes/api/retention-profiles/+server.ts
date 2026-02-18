// GET /api/retention-profiles — List all retention profiles

import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('retention_profiles')
		.select('*')
		.order('name');

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data ?? []);
};
