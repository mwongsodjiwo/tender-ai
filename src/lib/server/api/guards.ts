// Reusable API guards for authorization

import { json } from '@sveltejs/kit';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Guard that verifies the current user is a superadmin.
 * Returns a JSON error response if not authorized, or null if the check passes.
 */
export async function requireSuperadmin(
	supabase: SupabaseClient,
	user: User | null
): Promise<Response | null> {
	if (!user) {
		return json(
			{ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 },
			{ status: 401 }
		);
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('is_superadmin')
		.eq('id', user.id)
		.single();

	if (!profile?.is_superadmin) {
		return json(
			{ message: 'Alleen beheerders hebben toegang tot deze actie', code: 'FORBIDDEN', status: 403 },
			{ status: 403 }
		);
	}

	return null;
}
