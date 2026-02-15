// POST /api/context-search — Search documents and TenderNed data for relevant context

import type { RequestHandler } from './$types';
import { contextSearchSchema } from '$server/api/validation';
import { searchContext } from '$server/ai/context';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = contextSearchSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { query, project_id, organization_id, limit } = parsed.data;

	try {
		const results = await searchContext({
			supabase,
			query,
			projectId: project_id,
			organizationId: organization_id,
			limit
		});

		return apiSuccess(results);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Zoekfout';
		return apiError(500, 'INTERNAL_ERROR', errorMessage);
	}
};
