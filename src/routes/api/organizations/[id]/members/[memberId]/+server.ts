// PATCH /api/organizations/:id/members/:memberId — Update member role
// DELETE /api/organizations/:id/members/:memberId — Remove member

import type { RequestHandler } from './$types';
import { adminUpdateMemberRoleSchema } from '$server/api/validation';
import { requireSuperadmin } from '$server/api/guards';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	const guardResponse = await requireSuperadmin(supabase, user);
	if (guardResponse) return guardResponse;

	const body = await request.json();
	const parsed = adminUpdateMemberRoleSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { role } = parsed.data;

	const { data: member, error: updateError } = await supabase
		.from('organization_members')
		.update({ role })
		.eq('id', params.memberId)
		.eq('organization_id', params.id)
		.select()
		.single();

	if (updateError || !member) {
		return apiError(404, 'NOT_FOUND', 'Lid niet gevonden');
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user!.id,
		actorEmail: user!.email ?? undefined,
		action: 'admin_action',
		entityType: 'organization_member',
		entityId: params.memberId,
		changes: { role, action: 'update_role' }
	});

	return apiSuccess(member);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	const guardResponse = await requireSuperadmin(supabase, user);
	if (guardResponse) return guardResponse;

	const { error: deleteError } = await supabase
		.from('organization_members')
		.delete()
		.eq('id', params.memberId)
		.eq('organization_id', params.id);

	if (deleteError) {
		return apiError(500, 'DB_ERROR', deleteError.message);
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user!.id,
		actorEmail: user!.email ?? undefined,
		action: 'admin_action',
		entityType: 'organization_member',
		entityId: params.memberId,
		changes: { action: 'remove_member' }
	});

	return apiSuccess({ success: true });
};
