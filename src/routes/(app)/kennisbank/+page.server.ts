// Kennisbank page — load organization documents and stats

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { supabase, user } = locals;
	await parent(); // Auth guard vanuit layout

	if (!user) {
		throw error(401, 'Niet ingelogd');
	}

	// Get user's organizations
	const { data: memberships, error: memberError } = await supabase
		.from('organization_members')
		.select('organization_id, organization:organizations(id, name, slug)')
		.eq('profile_id', user.id);

	if (memberError) {
		throw error(500, 'Kon organisaties niet laden');
	}

	const organizations = (memberships ?? [])
		.map((m) => {
			const org = m.organization;
			if (Array.isArray(org)) return org[0] as { id: string; name: string; slug: string } | undefined;
			return org as { id: string; name: string; slug: string } | undefined;
		})
		.filter((o): o is { id: string; name: string; slug: string } => o != null);

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
