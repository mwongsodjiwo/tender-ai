// GET /api/projects/:id/audit — Query audit log for a project

import type { RequestHandler } from './$types';
import { auditLogQuerySchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const queryParams = {
		page: url.searchParams.get('page') ?? undefined,
		per_page: url.searchParams.get('per_page') ?? undefined,
		action: url.searchParams.get('action') ?? undefined,
		entity_type: url.searchParams.get('entity_type') ?? undefined,
		actor_id: url.searchParams.get('actor_id') ?? undefined
	};

	const parsed = auditLogQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { page, per_page, action, entity_type, actor_id } = parsed.data;
	const offset = (page - 1) * per_page;

	let query = supabase
		.from('audit_log')
		.select('*', { count: 'exact' })
		.eq('project_id', params.id)
		.order('created_at', { ascending: false })
		.range(offset, offset + per_page - 1);

	if (action) {
		query = query.eq('action', action);
	}

	if (entity_type) {
		query = query.eq('entity_type', entity_type);
	}

	if (actor_id) {
		query = query.eq('actor_id', actor_id);
	}

	const { data: entries, error: dbError, count } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess({
		entries: entries ?? [],
		total: count ?? 0,
		page,
		per_page
	});
};
