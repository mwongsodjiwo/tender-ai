// GET /api/projects/:id/members — List project members with roles
// POST /api/projects/:id/members — Add a project member with roles

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addProjectMemberSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: members, error: dbError } = await supabase
		.from('project_members')
		.select('*, profile:profiles(*), roles:project_member_roles(*)')
		.eq('project_id', params.id)
		.order('created_at');

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: members });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = addProjectMemberSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { profile_id, roles } = parsed.data;

	// Create project member
	const { data: member, error: memberError } = await supabase
		.from('project_members')
		.insert({ project_id: params.id, profile_id })
		.select()
		.single();

	if (memberError) {
		if (memberError.code === '23505') {
			return json(
				{ message: 'Gebruiker is al lid van dit project', code: 'DUPLICATE', status: 409 },
				{ status: 409 }
			);
		}
		return json({ message: memberError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	// Assign roles
	const roleInserts = roles.map((role) => ({
		project_member_id: member.id,
		role
	}));

	const { error: rolesError } = await supabase
		.from('project_member_roles')
		.insert(roleInserts);

	if (rolesError) {
		return json({ message: rolesError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	// Fetch complete member with profile and roles
	const { data: completeMember } = await supabase
		.from('project_members')
		.select('*, profile:profiles(*), roles:project_member_roles(*)')
		.eq('id', member.id)
		.single();

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
		entityType: 'project_member',
		entityId: member.id,
		changes: { profile_id, roles }
	});

	return json({ data: completeMember }, { status: 201 });
};
