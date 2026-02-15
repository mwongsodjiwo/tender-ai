// GET /api/organizations — List user's organizations
// POST /api/organizations — Create a new organization

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrganizationSchema } from '$server/api/validation';
import { requireSuperadmin } from '$server/api/guards';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('organizations')
		.select('*')
		.is('deleted_at', null)
		.order('name');

	if (dbError) {
		return json(
			{ message: dbError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	return json({ data });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	const guardResponse = await requireSuperadmin(supabase, user);
	if (guardResponse) return guardResponse;

	const body = await request.json();
	const parsed = createOrganizationSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { name, slug, description } = parsed.data;

	const { data: org, error: orgError } = await supabase
		.from('organizations')
		.insert({ name, slug, description })
		.select()
		.single();

	if (orgError) {
		if (orgError.code === '23505') {
			return json(
				{ message: 'Deze slug is al in gebruik', code: 'DUPLICATE_SLUG', status: 409 },
				{ status: 409 }
			);
		}
		return json(
			{ message: orgError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Add creator as owner
	const { error: memberError } = await supabase.from('organization_members').insert({
		organization_id: org.id,
		profile_id: user.id,
		role: 'owner'
	});

	if (memberError) {
		return json(
			{ message: memberError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	await logAudit(supabase, {
		organizationId: org.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'organization',
		entityId: org.id,
		changes: { name, slug }
	});

	return json({ data: org }, { status: 201 });
};
