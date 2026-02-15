// GET /api/projects/:id/members/:memberId — Get single project member with roles
// PATCH /api/projects/:id/members/:memberId — Update project member roles
// DELETE /api/projects/:id/members/:memberId — Remove project member

import type { RequestHandler } from './$types';
import { updateProjectMemberRolesSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: member, error: dbError } = await supabase
		.from('project_members')
		.select('*, profile:profiles(*), roles:project_member_roles(*)')
		.eq('id', params.memberId)
		.eq('project_id', params.id)
		.single();

	if (dbError || !member) {
		return apiError(404, 'NOT_FOUND', 'Lid niet gevonden');
	}

	return apiSuccess(member);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateProjectMemberRolesSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
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
		return apiError(404, 'NOT_FOUND', 'Lid niet gevonden');
	}

	// Delete existing roles
	const { error: deleteError } = await supabase
		.from('project_member_roles')
		.delete()
		.eq('project_member_id', params.memberId);

	if (deleteError) {
		return apiError(500, 'DB_ERROR', deleteError.message);
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
		return apiError(500, 'DB_ERROR', insertError.message);
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

	return apiSuccess(updated);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Verify member exists
	const { data: member, error: memberError } = await supabase
		.from('project_members')
		.select('id, profile_id')
		.eq('id', params.memberId)
		.eq('project_id', params.id)
		.single();

	if (memberError || !member) {
		return apiError(404, 'NOT_FOUND', 'Lid niet gevonden');
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
		return apiError(500, 'DB_ERROR', deleteError.message);
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

	return apiSuccess({ message: 'Lid verwijderd uit project' });
};
