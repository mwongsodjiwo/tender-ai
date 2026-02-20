// GET /api/projects — List projects for user
// POST /api/projects — Create a new project

import type { RequestHandler } from './$types';
import { createProjectSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const organizationId = url.searchParams.get('organization_id');
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10) || 100, 200);

	let query = supabase
		.from('projects')
		.select('*')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false })
		.limit(limit);

	if (organizationId) {
		query = query.eq('organization_id', organizationId);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createProjectSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { organization_id, name, description, procedure_type, estimated_value, publication_date, deadline_date } = parsed.data;

	// Create project
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.insert({
			organization_id,
			name,
			description: description ?? null,
			procedure_type: procedure_type ?? null,
			estimated_value: estimated_value ?? null,
			publication_date: publication_date ?? null,
			deadline_date: deadline_date ?? null,
			created_by: user.id
		})
		.select()
		.single();

	if (projectError) {
		return apiError(500, 'DB_ERROR', projectError.message);
	}

	// Add creator as project member
	const { data: member, error: memberError } = await supabase
		.from('project_members')
		.insert({
			project_id: project.id,
			profile_id: user.id
		})
		.select()
		.single();

	if (memberError) {
		return apiError(500, 'DB_ERROR', memberError.message);
	}

	// Assign project_leader role to creator
	await supabase.from('project_member_roles').insert({
		project_member_id: member.id,
		role: 'project_leader'
	});

	await logAudit(supabase, {
		organizationId: organization_id,
		projectId: project.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'project',
		entityId: project.id,
		changes: { name, procedure_type }
	});

	return apiSuccess(project, 201);
};
