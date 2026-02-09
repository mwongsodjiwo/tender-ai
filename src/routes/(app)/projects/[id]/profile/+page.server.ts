// Project profile page — load profile data

import type { PageServerLoad } from './$types';
import type { ProjectProfile } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data: profile } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	return {
		profile: (profile as ProjectProfile | null) ?? null
	};
};
