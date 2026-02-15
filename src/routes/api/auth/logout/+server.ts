// POST /api/auth/logout — Sign out

import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (user) {
		await logAudit(supabase, {
			actorId: user.id,
			actorEmail: user.email ?? undefined,
			action: 'logout',
			entityType: 'session'
		});
	}

	const { error } = await supabase.auth.signOut();

	if (error) {
		return apiError(500, 'AUTH_ERROR', error.message);
	}

	return apiSuccess({ message: 'Uitgelogd' });
};
