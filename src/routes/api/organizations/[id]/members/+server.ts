// GET /api/organizations/:id/members — List members
// POST /api/organizations/:id/members — Invite a member

import type { RequestHandler } from './$types';
import { inviteMemberSchema } from '$server/api/validation';
import { requireSuperadmin } from '$server/api/guards';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('organization_members')
		.select('*, profile:profiles(*)')
		.eq('organization_id', params.id)
		.order('created_at');

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	const guardResponse = await requireSuperadmin(supabase, user);
	if (guardResponse) return guardResponse;

	const body = await request.json();
	const parsed = inviteMemberSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { email, role } = parsed.data;

	// Find profile by email
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('id')
		.eq('email', email)
		.single();

	if (profileError || !profile) {
		return apiError(404, 'NOT_FOUND', 'Gebruiker niet gevonden');
	}

	const { data: member, error: memberError } = await supabase
		.from('organization_members')
		.insert({
			organization_id: params.id,
			profile_id: profile.id,
			role
		})
		.select()
		.single();

	if (memberError) {
		if (memberError.code === '23505') {
			return apiError(409, 'DUPLICATE', 'Gebruiker is al lid van deze organisatie');
		}
		return apiError(500, 'DB_ERROR', memberError.message);
	}

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'invite',
		entityType: 'organization_member',
		entityId: member.id,
		changes: { email, role }
	});

	return apiSuccess(member, 201);
};
