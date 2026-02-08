// GET /api/projects/:id/contract/settings — Get contract settings
// PUT /api/projects/:id/contract/settings — Update contract settings

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateContractSettingsSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, contract_type, general_conditions, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({
		data: {
			contract_type: project.contract_type,
			general_conditions: project.general_conditions
		}
	});
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateContractSettingsSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({
		data: {
			contract_type: project.contract_type,
			general_conditions: project.general_conditions
		}
	});
};
