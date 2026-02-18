// GET /api/projects/:projectId/suppliers — List project suppliers
// POST /api/projects/:projectId/suppliers — Link supplier to project

import type { RequestHandler } from './$types';
import { linkProjectSupplierSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('project_suppliers')
		.select('*')
		.eq('project_id', params.id)
		.order('created_at');

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
	const parsed = linkProjectSupplierSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('project_suppliers')
		.insert({
			project_id: params.id,
			...parsed.data
		})
		.select()
		.single();

	if (dbError) {
		if (dbError.code === '23505') {
			return apiError(409, 'DUPLICATE', 'Leverancier is al gekoppeld aan dit project');
		}
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	// Get project for org_id in audit
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
		entityType: 'project_supplier',
		entityId: data.id,
		changes: { supplier_id: parsed.data.supplier_id }
	});

	return apiSuccess(data, 201);
};
