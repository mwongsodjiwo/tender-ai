// GET /api/projects/:id/artifacts/:artifactId/versions — List artifact versions

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: versions, error: dbError } = await supabase
		.from('artifact_versions')
		.select('*')
		.eq('artifact_id', params.artifactId)
		.order('version', { ascending: false });

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: versions });
};
