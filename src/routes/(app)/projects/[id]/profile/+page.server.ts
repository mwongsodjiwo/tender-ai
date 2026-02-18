// Project profile page — load profile data, documents, and org NUTS codes

import type { PageServerLoad } from './$types';
import type { ProjectProfile, Document } from '$types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const organizationId = parentData.project.organization_id;

	const [profileResult, documentsResult, orgResult] = await Promise.all([
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
			.order('created_at', { ascending: false }),
		supabase
			.from('organizations')
			.select('nuts_codes')
			.eq('id', organizationId)
			.single()
	]);

	return {
		profile: (profileResult.data as ProjectProfile | null) ?? null,
		documents: (documentsResult.data as Document[] | null) ?? [],
		organizationNutsCodes: (orgResult.data?.nuts_codes as string[] | null) ?? []
	};
};
