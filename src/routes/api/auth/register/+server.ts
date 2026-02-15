// POST /api/auth/register — Register a new user

import type { RequestHandler } from './$types';
import { registerSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { email, password, first_name, last_name } = parsed.data;
	const { supabase } = locals;

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: { first_name, last_name }
		}
	});

	if (error) {
		return apiError(400, 'AUTH_ERROR', error.message);
	}

	if (data.user) {
		await logAudit(supabase, {
			actorId: data.user.id,
			actorEmail: email,
			action: 'create',
			entityType: 'profile',
			entityId: data.user.id
		});
	}

	return apiSuccess({ user: data.user, session: data.session }, 201);
};
