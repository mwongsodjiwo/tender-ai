// POST /api/auth/login — Sign in with email and password

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loginSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { email, password } = parsed.data;
	const { supabase } = locals;

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		return json(
			{ message: error.message, code: 'AUTH_ERROR', status: 401 },
			{ status: 401 }
		);
	}

	if (data.user) {
		await logAudit(supabase, {
			actorId: data.user.id,
			actorEmail: email,
			action: 'login',
			entityType: 'session',
			entityId: data.session?.access_token
		});
	}

	return json({ data: { user: data.user, session: data.session } });
};
