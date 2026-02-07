// GET /api/projects — List projects for user
// POST /api/projects — Create a new project

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createProjectSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const organizationId = url.searchParams.get('organization_id');

	let query = supabase
		.from('projects')
		.select('*')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	if (organizationId) {
		query = query.eq('organization_id', organizationId);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createProjectSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: projectError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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
		return json({ message: memberError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: project }, { status: 201 });
};
