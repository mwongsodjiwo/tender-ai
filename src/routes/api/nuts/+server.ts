// GET /api/nuts — Search NUTS reference codes with filtering

import type { RequestHandler } from './$types';
import { nutsSearchSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const parsed = nutsSearchSchema.safeParse({
		level: url.searchParams.get('level') ?? undefined,
		parent_code: url.searchParams.get('parent_code') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined,
		offset: url.searchParams.get('offset') ?? undefined
	});

	if (!parsed.success) {
		return apiError(
			400,
			'VALIDATION_ERROR',
			parsed.error.errors[0].message
		);
	}

	const { level, parent_code, search, limit, offset } =
		parsed.data;

	let query = supabase
		.from('nuts_codes')
		.select('*', { count: 'exact' });

	if (level !== undefined) {
		query = query.eq('level', level);
	}

	if (parent_code) {
		query = query.eq('parent_code', parent_code);
	}

	if (search) {
		query = query.or(`code.ilike.%${search}%,label_nl.ilike.%${search}%`);
	}

	query = query
		.order('code', { ascending: true })
		.range(offset, offset + limit - 1);

	const { data, count, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess({
		items: data ?? [],
		total: count ?? 0
	});
};
