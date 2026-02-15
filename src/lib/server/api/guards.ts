// Reusable API guards for authorization

import { apiError } from '$server/api/response';
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
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('is_superadmin')
		.eq('id', user.id)
		.single();

	if (!profile?.is_superadmin) {
		return apiError(403, 'FORBIDDEN', 'Alleen beheerders hebben toegang tot deze actie');
	}

	return null;
}
