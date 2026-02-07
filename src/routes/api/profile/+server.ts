// GET /api/profile — Get current user profile
// PATCH /api/profile — Update current user profile

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateProfileSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (dbError) {
		return json(
			{ message: 'Profiel niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	return json({ data });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateProfileSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { data, error: dbError } = await supabase
		.from('profiles')
		.update(parsed.data)
		.eq('id', user.id)
		.select()
		.single();

	if (dbError) {
		return json(
			{ message: dbError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	await logAudit(supabase, {
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'profile',
		entityId: user.id,
		changes: parsed.data
	});

	return json({ data });
};
