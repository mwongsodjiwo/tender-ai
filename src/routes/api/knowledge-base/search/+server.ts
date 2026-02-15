// POST /api/knowledge-base/search — Search knowledge base

import type { RequestHandler } from './$types';
import { knowledgeBaseSearchSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = knowledgeBaseSearchSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { query, cpv_codes, limit } = parsed.data;

	// Text search on knowledge_base.tenders + requirements
	let tenderQuery = supabase
		.schema('knowledge_base')
		.from('tenders')
		.select('id, external_id, title, description, contracting_authority, procedure_type, estimated_value, currency, publication_date, deadline_date, cpv_codes, nuts_codes, source_url')
		.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
		.limit(limit);

	if (cpv_codes && cpv_codes.length > 0) {
		tenderQuery = tenderQuery.overlaps('cpv_codes', cpv_codes);
	}

	const { data: tenders, error: tenderError } = await tenderQuery;

	if (tenderError) {
		return apiError(500, 'DB_ERROR', tenderError.message);
	}

	// Search requirements for matching text
	const { data: requirements, error: reqError } = await supabase
		.schema('knowledge_base')
		.from('requirements')
		.select('id, tender_id, requirement_text, category, source_section')
		.ilike('requirement_text', `%${query}%`)
		.limit(limit);

	if (reqError) {
		return apiError(500, 'DB_ERROR', reqError.message);
	}

	// Build results combining tenders and requirements
	const results = [
		...(tenders ?? []).map((t) => ({
			tender: t,
			requirement: null,
			snippet: t.description?.substring(0, 200) ?? t.title,
			relevance: 1.0
		})),
		...(requirements ?? []).map((r) => ({
			tender: null,
			requirement: r,
			snippet: r.requirement_text.substring(0, 200),
			relevance: 0.8
		}))
	];

	return apiSuccess({
		results: results.slice(0, limit),
		total: results.length
	});
};
