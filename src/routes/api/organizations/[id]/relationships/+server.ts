// GET /api/organizations/:id/relationships — List organization relationships
// POST /api/organizations/:id/relationships — Create relationship

import type { RequestHandler } from './$types';
import { createOrganizationRelationshipSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('organization_relationships')
		.select('*')
		.or(`source_organization_id.eq.${params.id},target_organization_id.eq.${params.id}`)
		.order('created_at', { ascending: false });

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data ?? []);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createOrganizationRelationshipSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('organization_relationships')
		.insert({
			source_organization_id: params.id,
			...parsed.data
		})
		.select()
		.single();

	if (dbError) {
		if (dbError.code === '23505') {
			return apiError(409, 'DUPLICATE', 'Deze relatie bestaat al');
		}
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'organization_relationship',
		entityId: data.id,
		changes: parsed.data
	});

	return apiSuccess(data, 201);
};
