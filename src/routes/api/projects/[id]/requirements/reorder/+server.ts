// POST /api/projects/:id/requirements/reorder — Reorder requirements (drag-and-drop)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reorderRequirementsSchema } from '$server/api/validation';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = reorderRequirementsSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: failed.error.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ message: 'Volgorde bijgewerkt' });
};
