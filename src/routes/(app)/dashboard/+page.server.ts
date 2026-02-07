// Dashboard page — load projects for the user

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	const { data: projects, error } = await supabase
		.from('projects')
		.select('*')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	return {
		projects: projects ?? []
	};
};
