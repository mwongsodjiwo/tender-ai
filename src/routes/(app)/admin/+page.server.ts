// Admin overview — load platform stats

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent(); // Auth guard vanuit layout

	if (!parentData.isSuperadmin) {
		throw error(403, 'Alleen beheerders hebben toegang');
	}

	const [orgResult, userResult] = await Promise.all([
		supabase.from('organizations').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		supabase.from('profiles').select('id', { count: 'exact', head: true })
	]);

	if (orgResult.error || userResult.error) {
		throw error(500, 'Kon statistieken niet laden');
	}

	return {
		orgCount: orgResult.count ?? 0,
		userCount: userResult.count ?? 0
	};
};
