// Admin organizations list — load all organizations with member count

import type { PageServerLoad } from './$types';
import { createServiceClient } from '$server/db/client';

export const load: PageServerLoad = async () => {
	const serviceClient = createServiceClient();

	const { data: organizations } = await serviceClient
		.from('organizations')
		.select('*, organization_members(count)')
		.is('deleted_at', null)
		.order('name');

	return {
		organizations: (organizations ?? []).map((org) => ({
			...org,
			memberCount: org.organization_members?.[0]?.count ?? 0
		}))
	};
};
