// POST /api/projects/:id/requirements/reorder — Reorder requirements (drag-and-drop)

import type { RequestHandler } from './$types';
import { reorderRequirementsSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = reorderRequirementsSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { ordered_ids } = parsed.data;

	// Update sort_order for each requirement
	const updates = ordered_ids.map((id, index) =>
		supabase
			.from('requirements')
			.update({ sort_order: index })
			.eq('id', id)
			.eq('project_id', params.id)
			.is('deleted_at', null)
	);

	const results = await Promise.all(updates);
	const failed = results.find((r) => r.error);

	if (failed?.error) {
		return apiError(500, 'DB_ERROR', failed.error.message);
	}

	return apiSuccess({ message: 'Volgorde bijgewerkt' });
};
