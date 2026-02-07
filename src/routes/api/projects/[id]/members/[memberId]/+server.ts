// GET /api/projects/:id/members/:memberId — Get single project member with roles
// PATCH /api/projects/:id/members/:memberId — Update project member roles
// DELETE /api/projects/:id/members/:memberId — Remove project member

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateProjectMemberRolesSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: member, error: dbError } = await supabase
		.from('project_members')
		.select('*, profile:profiles(*), roles:project_member_roles(*)')
		.eq('id', params.memberId)
		.eq('project_id', params.id)
		.single();

	if (dbError || !member) {
		return json({ message: 'Lid niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({ data: member });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateProjectMemberRolesSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { roles } = parsed.data;

	// Verify member exists in this project
	const { data: member, error: memberError } = await supabase
		.from('project_members')
		.select('id, profile_id')
		.eq('id', params.memberId)
		.eq('project_id', params.id)
		.single();

	if (memberError || !member) {
		return json({ message: 'Lid niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Delete existing roles
	const { error: deleteError } = await supabase
		.from('project_member_roles')
		.delete()
		.eq('project_member_id', params.memberId);

	if (deleteError) {
		return json({ message: deleteError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	// Insert new roles
	const roleInserts = roles.map((role) => ({
		project_member_id: params.memberId,
		role
	}));

	const { error: insertError } = await supabase
		.from('project_member_roles')
		.insert(roleInserts);

	if (insertError) {
		return json({ message: insertError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	// Fetch updated member
	const { data: updated } = await supabase
		.from('project_members')
		.select('*, profile:profiles(*), roles:project_member_roles(*)')
		.eq('id', params.memberId)
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
		action: 'update',
		entityType: 'project_member_roles',
		entityId: params.memberId,
		changes: { roles }
	});

	return json({ data: updated });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Verify member exists
	const { data: member, error: memberError } = await supabase
		.from('project_members')
		.select('id, profile_id')
		.eq('id', params.memberId)
		.eq('project_id', params.id)
		.single();

	if (memberError || !member) {
		return json({ message: 'Lid niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Delete roles first (cascade should handle this, but be explicit)
	await supabase
		.from('project_member_roles')
		.delete()
		.eq('project_member_id', params.memberId);

	const { error: deleteError } = await supabase
		.from('project_members')
		.delete()
		.eq('id', params.memberId);

	if (deleteError) {
		return json({ message: deleteError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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
		action: 'delete',
		entityType: 'project_member',
		entityId: params.memberId,
		changes: { profile_id: member.profile_id }
	});

	return json({ data: { message: 'Lid verwijderd uit project' } });
};
