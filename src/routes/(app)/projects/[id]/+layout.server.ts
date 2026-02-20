// Project layout — shared data for all project sub-pages

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();

	// Load project + members in parallel
	const [{ data: project, error: projectError }, { data: members }] = await Promise.all([
		supabase.from('projects').select('*').eq('id', params.id).is('deleted_at', null).single(),
		supabase
			.from('project_members')
			.select('*, profile:profiles(first_name, last_name, email, phone, job_title), roles:project_member_roles(role)')
			.eq('project_id', params.id)
	]);

	if (projectError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	// Load organization members (depends on project.organization_id)
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
