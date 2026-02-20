// GET /api/organizations/:id/members — List members (search, filter, pagination)
// POST /api/organizations/:id/members — Invite a member

import type { RequestHandler } from './$types';
import { inviteMemberSchema, memberSearchSchema } from '$server/api/validation';
import { requireSuperadmin } from '$server/api/guards';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const parsed = memberSearchSchema.safeParse(
		Object.fromEntries(url.searchParams)
	);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { search, status, limit, offset } = parsed.data;

	let query = supabase
		.from('organization_members')
		.select('*, profile:profiles(*)', { count: 'exact' })
		.eq('organization_id', params.id);

	if (status !== 'all') {
		query = query.eq('status', status);
	}

	if (search) {
		query = query.or(
			`profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%,profile.email.ilike.%${search}%`,
			{ foreignTable: 'profiles' }
		);
	}

	const { data, count, error: dbError } = await query
		.order('created_at')
		.range(offset, offset + limit - 1);

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess({ items: data, total: count ?? 0 });
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
			return apiError(409, 'DUPLICATE', 'Gebruiker is al lid');
		}
		return apiError(500, 'DB_ERROR', memberError.message);
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user!.id,
		actorEmail: user!.email ?? undefined,
		action: 'invite',
		entityType: 'organization_member',
		entityId: member.id,
		changes: { email, role }
	});

	return apiSuccess(member, 201);
};
