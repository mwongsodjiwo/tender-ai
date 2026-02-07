// POST /api/auth/logout — Sign out

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';

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
		return json(
			{ message: error.message, code: 'AUTH_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	return json({ data: { message: 'Uitgelogd' } });
};
