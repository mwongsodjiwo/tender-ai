// POST /api/projects/:id/uea/initialize — Initialize UEA selections for a project
// Creates selection records for all questions (mandatory=selected, optional=based on param)

import type { RequestHandler } from './$types';
import { initializeUeaSelectionsSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json().catch(() => ({}));
	const parsed = initializeUeaSelectionsSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { select_all_optional } = parsed.data;

	// Verify project exists
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Load all active questions
	const { data: questions, error: qError } = await supabase
		.from('uea_questions')
		.select('id, is_mandatory')
		.eq('is_active', true);

	if (qError || !questions) {
		return apiError(500, 'DB_ERROR', 'Kon UEA-vragen niet laden');
	}

	// Build selection records
	const selections = questions.map((q: { id: string; is_mandatory: boolean }) => ({
		project_id: params.id,
		question_id: q.id,
		is_selected: q.is_mandatory || select_all_optional
	}));

	// Upsert all selections
	const { error: upsertError } = await supabase
		.from('uea_project_selections')
		.upsert(selections, { onConflict: 'project_id,question_id' });

	if (upsertError) {
		return apiError(500, 'DB_ERROR', upsertError.message);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'uea_selections',
		changes: {
			total_questions: questions.length,
			select_all_optional
		}
	});

	return apiSuccess({
		initialized: true,
		total: questions.length,
		selected: selections.filter((s: { is_selected: boolean }) => s.is_selected).length
	}, 201);
};
