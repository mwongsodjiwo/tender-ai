// GET /api/organizations/:id/settings — Get organization settings
// PATCH /api/organizations/:id/settings — Update organization settings

import type { RequestHandler } from './$types';
import { updateOrganizationSettingsSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('organization_settings')
		.select('*')
		.eq('organization_id', params.id)
		.single();

	if (dbError) {
		// If no settings exist yet, return defaults
		if (dbError.code === 'PGRST116') {
			return apiSuccess(null);
		}
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateOrganizationSettingsSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Check if settings exist — upsert
	const { data: existing } = await supabase
		.from('organization_settings')
		.select('id')
		.eq('organization_id', params.id)
		.single();

	let data;
	let dbError;

	if (existing) {
		const result = await supabase
			.from('organization_settings')
			.update(parsed.data)
			.eq('organization_id', params.id)
			.select()
			.single();
		data = result.data;
		dbError = result.error;
	} else {
		const result = await supabase
			.from('organization_settings')
			.insert({ organization_id: params.id, ...parsed.data })
			.select()
			.single();
		data = result.data;
		dbError = result.error;
	}

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'organization_settings',
		entityId: data.id,
		changes: parsed.data
	});

	return apiSuccess(data);
};
