// App layout guard — redirect to login if not authenticated

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Organization, Project } from '$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/login');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	// Load organizations the user is a member of (via join, so superadmins don't see all orgs in nav)
	const { data: memberships } = await locals.supabase
		.from('organization_members')
		.select('organization:organizations!organization_members_organization_id_fkey(*)')
		.eq('profile_id', user.id);

	const organizations = (memberships ?? [])
		.map((m: { organization: unknown }) => m.organization as Organization | null)
		.filter((org): org is Organization => org != null && org.deleted_at == null)
		.sort((a, b) => a.name.localeCompare(b.name));

	// Load projects for sidebar navigation (all non-deleted projects the user can see)
	const { data: projects } = await locals.supabase
		.from('projects')
		.select('id, name, status, updated_at')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	// Load recent notifications + unread count for the bell
	const [{ data: recentNotifications }, { count: unreadCount }] = await Promise.all([
		locals.supabase
			.from('notifications')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(10),
		locals.supabase
			.from('notifications')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.eq('is_read', false)
	]);

	return {
		profile,
		organizations,
		projects: (projects ?? []) as Pick<Project, 'id' | 'name' | 'status' | 'updated_at'>[],
		isSuperadmin: profile?.is_superadmin ?? false,
		hasOrganization: organizations.length > 0,
		notifications: recentNotifications ?? [],
		unreadNotificationCount: unreadCount ?? 0
	};
};
