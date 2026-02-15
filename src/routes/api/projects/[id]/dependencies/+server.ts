// GET /api/projects/:id/dependencies — List all dependencies
// POST /api/projects/:id/dependencies — Create dependency (with cycle detection)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDependencySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { wouldCreateCycle } from '$server/planning/critical-path';
import type { ActivityDependency } from '$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const { data, error: dbError } = await supabase
		.from('activity_dependencies')
		.select('*')
		.eq('project_id', params.id);

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: data ?? [] });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const body = await request.json();
	const parsed = createDependencySchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Prevent self-referencing dependency
	if (parsed.data.source_type === parsed.data.target_type && parsed.data.source_id === parsed.data.target_id) {
		return json(
			{ message: 'Een item kan niet afhankelijk zijn van zichzelf', code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Check for circular dependencies
	const { data: existingDeps } = await supabase
		.from('activity_dependencies')
		.select('source_id, target_id')
		.eq('project_id', params.id);

	if (existingDeps && wouldCreateCycle(existingDeps as ActivityDependency[], parsed.data.source_id, parsed.data.target_id)) {
		return json(
			{ message: 'Deze afhankelijkheid zou een circulaire keten veroorzaken', code: 'CIRCULAR_DEPENDENCY', status: 400 },
			{ status: 400 }
		);
	}

	const { data: dependency, error: dbError } = await supabase
		.from('activity_dependencies')
		.insert({ project_id: params.id, ...parsed.data })
		.select()
		.single();

	if (dbError) {
		// Handle unique constraint violation
		if (dbError.code === '23505') {
			return json(
				{ message: 'Deze afhankelijkheid bestaat al', code: 'DUPLICATE', status: 409 },
				{ status: 409 }
			);
		}
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: dependency }, { status: 201 });
};
