// Audit log sub-page — minimal server load (AuditLog component fetches its own data)

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};
