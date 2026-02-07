// POST /api/context-search — Search documents and TenderNed data for relevant context

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contextSearchSchema } from '$server/api/validation';
import { searchContext } from '$server/ai/context';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = contextSearchSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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

		return json({ data: results });
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Zoekfout';
		return json({ message: errorMessage, code: 'SEARCH_ERROR', status: 500 }, { status: 500 });
	}
};
