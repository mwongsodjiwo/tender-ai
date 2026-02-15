// GET /api/projects/:id/emvi — Get scoring methodology + all criteria
// POST /api/projects/:id/emvi — Create a new EMVI criterion

import type { RequestHandler } from './$types';
import { createEmviCriterionSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Load project scoring methodology
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, scoring_methodology, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Load all active criteria
	const { data: criteria, error: critError } = await supabase
		.from('emvi_criteria')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('sort_order', { ascending: true });

	if (critError) {
		return apiError(500, 'DB_ERROR', critError.message);
	}

	// Calculate total weight
	const totalWeight = (criteria ?? []).reduce(
		(sum: number, c: { weight_percentage: number }) => sum + Number(c.weight_percentage),
		0
	);

	return apiSuccess({
		scoring_methodology: project.scoring_methodology,
		criteria: criteria ?? [],
		total_weight: Math.round(totalWeight * 100) / 100,
		is_valid: Math.abs(totalWeight - 100) < 0.01
	});
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createEmviCriterionSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { name, description, criterion_type, weight_percentage, sort_order } = parsed.data;

	// Determine sort_order if not provided
	let finalSortOrder = sort_order;
	if (finalSortOrder === undefined) {
		const { data: maxSort } = await supabase
			.from('emvi_criteria')
			.select('sort_order')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('sort_order', { ascending: false })
			.limit(1)
			.single();

		finalSortOrder = (maxSort?.sort_order ?? -1) + 1;
	}

	const { data: criterion, error: dbError } = await supabase
		.from('emvi_criteria')
		.insert({
			project_id: params.id,
			name,
			description: description ?? '',
			criterion_type,
			weight_percentage,
			sort_order: finalSortOrder,
			created_by: user.id
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
		entityType: 'emvi_criterion',
		entityId: criterion.id,
		changes: { name, criterion_type, weight_percentage }
	});

	return apiSuccess(criterion, 201);
};
