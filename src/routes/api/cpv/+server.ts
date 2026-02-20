// GET /api/cpv — Search CPV reference codes with filtering

import type { RequestHandler } from './$types';
import { cpvSearchSchema } from '$server/api/validation';
import { apiError, apiSuccessCached } from '$server/api/response';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const parsed = cpvSearchSchema.safeParse({
		category_type: url.searchParams.get('category_type') ?? undefined,
		division: url.searchParams.get('division') ?? undefined,
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

	const { category_type, division, search, limit, offset } =
		parsed.data;

	let query = supabase
		.from('cpv_codes')
		.select('*', { count: 'exact' });

	if (category_type) {
		query = query.eq('category_type', category_type);
	}

	if (division) {
		query = query.eq('division', division);
	}

	if (search) {
		query = query.or(`code.ilike.%${search}%,description_nl.ilike.%${search}%`);
	}

	query = query
		.order('code', { ascending: true })
		.range(offset, offset + limit - 1);

	const { data, count, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccessCached({
		items: data ?? [],
		total: count ?? 0
	}, 3600);
};
