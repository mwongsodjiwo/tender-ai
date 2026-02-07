// Kennisbank page — load organization documents and stats

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw error(401, 'Niet ingelogd');
	}

	// Get user's organizations
	const { data: memberships } = await supabase
		.from('organization_members')
		.select('organization_id, organization:organizations(id, name, slug)')
		.eq('profile_id', user.id);

	const organizations = (memberships ?? [])
		.map((m) => m.organization as { id: string; name: string; slug: string })
		.filter(Boolean);

	const selectedOrgId = url.searchParams.get('organization_id') ?? organizations[0]?.id ?? null;

	// Load organization-level documents (not project-specific)
	let documents: unknown[] = [];
	if (selectedOrgId) {
		const { data } = await supabase
			.from('documents')
			.select('*')
			.eq('organization_id', selectedOrgId)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		documents = data ?? [];
	}

	// Get TenderNed item count
	const { count: tenderNedCount } = await supabase
		.from('tenderned_items')
		.select('*', { count: 'exact', head: true });

	return {
		organizations,
		selectedOrgId,
		documents,
		tenderNedCount: tenderNedCount ?? 0
	};
};
