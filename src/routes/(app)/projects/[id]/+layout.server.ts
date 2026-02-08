// Project layout — shared data for all project sub-pages

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projectError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	// Load project members with roles
	const { data: members } = await supabase
		.from('project_members')
		.select('*, profile:profiles(first_name, last_name, email), roles:project_member_roles(role)')
		.eq('project_id', params.id);

	// Load organization members for add-member dropdown
	const { data: organizationMembers } = await supabase
		.from('organization_members')
		.select('profile_id, profile:profiles(first_name, last_name, email)')
		.eq('organization_id', project.organization_id);

	return {
		project,
		profile: parentData.profile,
		members: members ?? [],
		organizationMembers: organizationMembers ?? []
	};
};
