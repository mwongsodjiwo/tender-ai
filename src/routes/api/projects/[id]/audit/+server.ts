// GET /api/projects/:id/audit — Query audit log for a project

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auditLogQuerySchema } from '$server/api/validation';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
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
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({
		data: {
			entries: entries ?? [],
			total: count ?? 0,
			page,
			per_page
		}
	});
};
