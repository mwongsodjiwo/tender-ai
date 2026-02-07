// GET /api/organizations/:id — Get organization details
// PATCH /api/organizations/:id — Update organization

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateOrganizationSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('organizations')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError) {
		return json(
			{ message: 'Organisatie niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	return json({ data });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateOrganizationSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { data, error: dbError } = await supabase
		.from('organizations')
		.update(parsed.data)
		.eq('id', params.id)
		.select()
		.single();

	if (dbError) {
		return json(
			{ message: dbError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'organization',
		entityId: params.id,
		changes: parsed.data
	});

	return json({ data });
};
