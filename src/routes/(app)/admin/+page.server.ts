// Admin overview — load platform stats

import type { PageServerLoad } from './$types';
import { createServiceClient } from '$server/db/client';

export const load: PageServerLoad = async () => {
	const serviceClient = createServiceClient();

	const [orgResult, userResult] = await Promise.all([
		serviceClient.from('organizations').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		serviceClient.from('profiles').select('id', { count: 'exact', head: true })
	]);

	return {
		orgCount: orgResult.count ?? 0,
		userCount: userResult.count ?? 0
	};
};
