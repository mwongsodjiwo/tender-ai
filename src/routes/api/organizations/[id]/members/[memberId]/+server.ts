// PATCH /api/organizations/:id/members/:memberId — Update member (role, status, manager)
// DELETE /api/organizations/:id/members/:memberId — Remove member

import type { RequestHandler } from './$types';
import {
	adminUpdateMemberRoleSchema,
	updateMemberSchema
} from '$server/api/validation';
import { requireSuperadmin } from '$server/api/guards';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	const guardResponse = await requireSuperadmin(supabase, user);
	if (guardResponse) return guardResponse;

	const body = await request.json();

	// Support both role-only updates and status/manager updates
	const memberParsed = updateMemberSchema.safeParse(body);
	const roleParsed = adminUpdateMemberRoleSchema.safeParse(body);

	const updateFields: Record<string, unknown> = {};

	if (roleParsed.success && roleParsed.data.role) {
		updateFields.role = roleParsed.data.role;
	}

	if (memberParsed.success) {
		if (memberParsed.data.status !== undefined) {
			updateFields.status = memberParsed.data.status;
		}
		if (memberParsed.data.manager_id !== undefined) {
			updateFields.manager_id = memberParsed.data.manager_id;
		}
	}

	if (Object.keys(updateFields).length === 0) {
		return apiError(400, 'VALIDATION_ERROR', 'Geen geldige velden opgegeven');
	}

	const { data: member, error: updateError } = await supabase
		.from('organization_members')
		.update(updateFields)
		.eq('id', params.memberId)
		.eq('organization_id', params.id)
		.select('*, profile:profiles(*)')
		.single();

	if (updateError || !member) {
		return apiError(404, 'NOT_FOUND', 'Lid niet gevonden');
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user!.id,
		actorEmail: user!.email ?? undefined,
		action: 'update',
		entityType: 'organization_member',
		entityId: params.memberId,
		changes: updateFields
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
