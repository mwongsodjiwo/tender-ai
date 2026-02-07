// App layout guard — redirect to login if not authenticated

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/login');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	const { data: organizations } = await locals.supabase
		.from('organizations')
		.select('*')
		.is('deleted_at', null)
		.order('name');

	return {
		profile,
		organizations: organizations ?? []
	};
};
