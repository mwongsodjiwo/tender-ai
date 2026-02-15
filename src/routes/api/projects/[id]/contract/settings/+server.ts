// GET /api/projects/:id/contract/settings — Get contract settings
// PUT /api/projects/:id/contract/settings — Update contract settings

import type { RequestHandler } from './$types';
import { updateContractSettingsSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, contract_type, general_conditions, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	return apiSuccess({
		contract_type: project.contract_type,
		general_conditions: project.general_conditions
	});
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateContractSettingsSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = {};
	if (parsed.data.contract_type !== undefined) {
		updateData.contract_type = parsed.data.contract_type;
	}
	if (parsed.data.general_conditions !== undefined) {
		updateData.general_conditions = parsed.data.general_conditions;
	}

	const { data: project, error: dbError } = await supabase
		.from('projects')
		.update(updateData)
		.eq('id', params.id)
		.select('id, contract_type, general_conditions, organization_id')
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'contract_settings',
		entityId: params.id,
		changes: updateData
	});

	return apiSuccess({
		contract_type: project.contract_type,
		general_conditions: project.general_conditions
	});
};
