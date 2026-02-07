// New project page — load organizations for selection

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: organizations } = await supabase
		.from('organizations')
		.select('id, name, slug')
		.is('deleted_at', null)
		.order('name');

	return {
		organizations: organizations ?? []
	};
};
