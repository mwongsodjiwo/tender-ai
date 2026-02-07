// Profile settings page — data loaded from parent layout

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { profile } = await parent();

	return {
		profile
	};
};
