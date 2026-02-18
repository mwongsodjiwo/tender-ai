// GET /api/projects/:projectId/questions — List incoming questions
// POST /api/projects/:projectId/questions — Register new question

import type { RequestHandler } from './$types';
import { createQuestionSchema, questionListQuerySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const queryParams = Object.fromEntries(url.searchParams);
	const parsed = questionListQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	let query = supabase
		.from('incoming_questions')
		.select('*')
		.eq('project_id', params.id)
		.order('question_number');

	if (parsed.data.status) {
		query = query.eq('status', parsed.data.status);
	}
	if (parsed.data.supplier_id) {
		query = query.eq('supplier_id', parsed.data.supplier_id);
	}

	query = query.range(
		parsed.data.offset,
		parsed.data.offset + parsed.data.limit - 1
	);

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createQuestionSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('incoming_questions')
		.insert({
			project_id: params.id,
			...parsed.data
		})
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', params.id)
		.single();

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'incoming_question',
		entityId: data.id,
		changes: { question_text: parsed.data.question_text }
	});

	return apiSuccess(data, 201);
};
