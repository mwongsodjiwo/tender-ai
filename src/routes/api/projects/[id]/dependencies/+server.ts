// GET /api/projects/:id/dependencies — List all dependencies
// POST /api/projects/:id/dependencies — Create dependency (with cycle detection)

import type { RequestHandler } from './$types';
import { createDependencySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { wouldCreateCycle } from '$server/planning/critical-path';
import type { ActivityDependency } from '$types';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const { data, error: dbError } = await supabase
		.from('activity_dependencies')
		.select('*')
		.eq('project_id', params.id);

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

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const body = await request.json();
	const parsed = createDependencySchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Prevent self-referencing dependency
	if (parsed.data.source_type === parsed.data.target_type && parsed.data.source_id === parsed.data.target_id) {
		return apiError(400, 'VALIDATION_ERROR', 'Een item kan niet afhankelijk zijn van zichzelf');
	}

	// Check for circular dependencies
	const { data: existingDeps } = await supabase
		.from('activity_dependencies')
		.select('source_id, target_id')
		.eq('project_id', params.id);

	if (existingDeps && wouldCreateCycle(existingDeps as ActivityDependency[], parsed.data.source_id, parsed.data.target_id)) {
		return apiError(400, 'VALIDATION_ERROR', 'Deze afhankelijkheid zou een circulaire keten veroorzaken');
	}

	const { data: dependency, error: dbError } = await supabase
		.from('activity_dependencies')
		.insert({ project_id: params.id, ...parsed.data })
		.select()
		.single();

	if (dbError) {
		// Handle unique constraint violation
		if (dbError.code === '23505') {
			return apiError(409, 'DUPLICATE', 'Deze afhankelijkheid bestaat al');
		}
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'activity_dependency',
		entityId: dependency.id,
		changes: parsed.data
	});

	return apiSuccess(dependency, 201);
};
