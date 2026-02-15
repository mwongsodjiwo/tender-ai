// POST /api/auth/login — Sign in with email and password

import type { RequestHandler } from './$types';
import { loginSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { email, password } = parsed.data;
	const { supabase } = locals;

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		return apiError(401, 'AUTH_ERROR', error.message);
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

	return apiSuccess({ user: data.user, session: data.session });
};
