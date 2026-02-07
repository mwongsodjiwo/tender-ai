// GET /api/organizations/:id/members — List members
// POST /api/organizations/:id/members — Invite a member

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inviteMemberSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('organization_members')
		.select('*, profile:profiles(*)')
		.eq('organization_id', params.id)
		.order('created_at');

	if (dbError) {
		return json(
			{ message: dbError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	return json({ data });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = inviteMemberSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { email, role } = parsed.data;

	// Find profile by email
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('id')
		.eq('email', email)
		.single();

	if (profileError || !profile) {
		return json(
			{ message: 'Gebruiker niet gevonden', code: 'USER_NOT_FOUND', status: 404 },
			{ status: 404 }
		);
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
			return json(
				{ message: 'Gebruiker is al lid van deze organisatie', code: 'DUPLICATE', status: 409 },
				{ status: 409 }
			);
		}
		return json(
			{ message: memberError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
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

	return json({ data: member }, { status: 201 });
};
