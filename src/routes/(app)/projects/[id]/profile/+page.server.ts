// Project profile page — load profile data and uploaded documents

import type { PageServerLoad } from './$types';
import type { ProjectProfile, Document } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const [profileResult, documentsResult] = await Promise.all([
		supabase
			.from('project_profiles')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.maybeSingle(),
		supabase
			.from('documents')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
	]);

	return {
		profile: (profileResult.data as ProjectProfile | null) ?? null,
		documents: (documentsResult.data as Document[] | null) ?? []
	};
};
