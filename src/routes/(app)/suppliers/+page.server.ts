// Suppliers page — load suppliers for active organization

import type { PageServerLoad } from './$types';
import type { Supplier } from '$types';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { organizations } = await parent();
	const { supabase } = locals;

	// Determine active org from query or first org
	const orgId = url.searchParams.get('org') ?? organizations[0]?.id ?? null;

	if (!orgId) {
		return { suppliers: [] as Supplier[], organizationId: null };
	}

	const { data, error } = await supabase
		.from('suppliers')
		.select('*')
		.eq('organization_id', orgId)
		.is('deleted_at', null)
		.order('company_name');

	return {
		suppliers: (data ?? []) as Supplier[],
		organizationId: orgId,
		loadError: error?.message ?? null
	};
};
