// PATCH /api/projects/:projectId/suppliers/:supplierId — Update project supplier

import type { RequestHandler } from './$types';
import { updateProjectSupplierSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateProjectSupplierSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('project_suppliers')
		.update({ ...parsed.data, updated_at: new Date().toISOString() })
		.eq('project_id', params.id)
		.eq('supplier_id', params.supplierId)
		.select()
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Project-leverancier koppeling niet gevonden');
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
		action: 'update',
		entityType: 'project_supplier',
		entityId: data.id,
		changes: parsed.data
	});

	return apiSuccess(data);
};
