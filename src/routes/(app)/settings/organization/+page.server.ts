// Organization settings page — load org details and members

import type { PageServerLoad } from './$types';
import type { Organization, OrganizationMemberWithProfile } from '$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { organizations, profile, isSuperadmin } = await parent();
	const { supabase } = locals;

	// Use the first organization (MVP: single-org assumption)
	const organization: Organization | null = organizations[0] ?? null;

	if (!organization) {
		return {
			organization: null,
			members: [],
			currentMemberRole: null,
			isSuperadmin: isSuperadmin ?? false
		};
	}

	// Load members with profile data
	const { data: members } = await supabase
		.from('organization_members')
		.select('*, profile:profiles(*)')
		.eq('organization_id', organization.id)
		.order('created_at');

	// Determine the current user's role in this organization
	const currentMember = (members ?? []).find(
		(m: OrganizationMemberWithProfile) => m.profile_id === profile?.id
	);

	return {
		organization,
		members: (members ?? []) as OrganizationMemberWithProfile[],
		currentMemberRole: currentMember?.role ?? null,
		isSuperadmin: isSuperadmin ?? false
	};
};
