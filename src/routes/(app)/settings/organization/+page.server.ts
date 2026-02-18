// Organization settings page — load org, members, settings, profiles, relationships

import type { PageServerLoad } from './$types';
import type {
	Organization,
	OrganizationMemberWithProfile,
	OrganizationSettings,
	RetentionProfile,
	OrganizationRelationship
} from '$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { organizations, profile, isSuperadmin } = await parent();
	const { supabase } = locals;

	const organization: Organization | null = organizations[0] ?? null;

	if (!organization) {
		return {
			organization: null,
			members: [],
			currentMemberRole: null,
			isSuperadmin: isSuperadmin ?? false,
			settings: null,
			retentionProfiles: [],
			relationships: [],
			loadError: null
		};
	}

	const [membersResult, settingsResult, profilesResult, relsResult] =
		await Promise.all([
			supabase.from('organization_members')
				.select('*, profile:profiles(*)')
				.eq('organization_id', organization.id)
				.order('created_at'),
			supabase.from('organization_settings')
				.select('*')
				.eq('organization_id', organization.id)
				.single(),
			supabase.from('retention_profiles')
				.select('*')
				.order('name'),
			supabase.from('organization_relationships')
				.select('*')
				.or(`source_organization_id.eq.${organization.id},target_organization_id.eq.${organization.id}`)
				.order('created_at', { ascending: false })
		]);

	const members = (membersResult.data ?? []) as OrganizationMemberWithProfile[];
	const currentMember = members.find(
		(m) => m.profile_id === profile?.id
	);

	return {
		organization,
		members,
		currentMemberRole: currentMember?.role ?? null,
		isSuperadmin: isSuperadmin ?? false,
		settings: (settingsResult.data ?? null) as OrganizationSettings | null,
		retentionProfiles: (profilesResult.data ?? []) as RetentionProfile[],
		relationships: (relsResult.data ?? []) as OrganizationRelationship[],
		loadError: membersResult.error?.message ?? null
	};
};
