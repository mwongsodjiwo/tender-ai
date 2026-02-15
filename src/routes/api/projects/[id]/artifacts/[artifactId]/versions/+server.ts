// GET /api/projects/:id/artifacts/:artifactId/versions — List artifact versions

import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: versions, error: dbError } = await supabase
		.from('artifact_versions')
		.select('*')
		.eq('artifact_id', params.artifactId)
		.order('version', { ascending: false });

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(versions);
};
