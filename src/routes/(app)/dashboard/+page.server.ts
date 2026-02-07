// Dashboard page — load projects for the user

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { hasOrganization } = await parent();
	const { supabase } = locals;

	const { data: projects } = await supabase
		.from('projects')
		.select('*')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	return {
		projects: projects ?? [],
		hasOrganization
	};
};
