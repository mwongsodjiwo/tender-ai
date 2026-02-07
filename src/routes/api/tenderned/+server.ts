// GET /api/tenderned — Search TenderNed items

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { tenderNedSearchSchema } from '$server/api/validation';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const parsed = tenderNedSearchSchema.safeParse({
		query: url.searchParams.get('query') ?? '',
		procedure_type: url.searchParams.get('procedure_type') ?? undefined,
		cpv_code: url.searchParams.get('cpv_code') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined,
		offset: url.searchParams.get('offset') ?? undefined
	});

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { query, procedure_type, cpv_code, limit, offset } = parsed.data;

	// Build search query
	let dbQuery = supabase
		.from('tenderned_items')
		.select('*', { count: 'exact' })
		.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

	if (procedure_type) {
		dbQuery = dbQuery.eq('procedure_type', procedure_type);
	}

	if (cpv_code) {
		dbQuery = dbQuery.contains('cpv_codes', [cpv_code]);
	}

	dbQuery = dbQuery
		.order('publication_date', { ascending: false })
		.range(offset, offset + limit - 1);

	const { data, count, error: dbError } = await dbQuery;

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({
		data: {
			items: data ?? [],
			total: count ?? 0
		}
	});
};
