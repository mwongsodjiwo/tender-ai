// POST /api/knowledge-base/search — Search knowledge base

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { knowledgeBaseSearchSchema } from '$server/api/validation';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = knowledgeBaseSearchSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { query, cpv_codes, limit } = parsed.data;

	// Text search on knowledge_base.tenders + requirements
	let tenderQuery = supabase
		.from('knowledge_base.tenders')
		.select('id, external_id, title, description, contracting_authority, procedure_type, estimated_value, currency, publication_date, deadline_date, cpv_codes, nuts_codes, source_url')
		.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
		.limit(limit);

	if (cpv_codes && cpv_codes.length > 0) {
		tenderQuery = tenderQuery.overlaps('cpv_codes', cpv_codes);
	}

	const { data: tenders, error: tenderError } = await tenderQuery;

	if (tenderError) {
		return json({ message: tenderError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	// Search requirements for matching text
	const { data: requirements, error: reqError } = await supabase
		.from('knowledge_base.requirements')
		.select('id, tender_id, requirement_text, category, source_section')
		.ilike('requirement_text', `%${query}%`)
		.limit(limit);

	if (reqError) {
		return json({ message: reqError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({
		data: {
			results: results.slice(0, limit),
			total: results.length
		}
	});
};
