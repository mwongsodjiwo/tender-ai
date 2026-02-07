// POST /api/auth/register — Register a new user

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { email, password, full_name } = parsed.data;
	const { supabase } = locals;

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: { full_name }
		}
	});

	if (error) {
		return json(
			{ message: error.message, code: 'AUTH_ERROR', status: 400 },
			{ status: 400 }
		);
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

	return json({ data: { user: data.user, session: data.session } }, { status: 201 });
};
