// PATCH /api/organizations/:id/relationships/:relId — Update relationship

import type { RequestHandler } from './$types';
import { updateOrganizationRelationshipSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateOrganizationRelationshipSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('organization_relationships')
		.update(parsed.data)
		.eq('id', params.relId)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	if (!data) {
		return apiError(404, 'NOT_FOUND', 'Relatie niet gevonden');
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'organization_relationship',
		entityId: params.relId,
		changes: parsed.data
	});

	return apiSuccess(data);
};
