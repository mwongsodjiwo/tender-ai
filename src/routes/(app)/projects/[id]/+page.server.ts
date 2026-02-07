// Project detail page — load project with artifacts, members, reviewers

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projectError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(name, slug)')
		.eq('project_id', params.id)
		.order('sort_order');

	const { data: members } = await supabase
		.from('project_members')
		.select('*, profile:profiles(first_name, last_name, email), roles:project_member_roles(role)')
		.eq('project_id', params.id);

	// Load reviewers for all artifacts in this project
	const artifactIds = (artifacts ?? []).map((a) => a.id);
	let reviewers: unknown[] = [];

	if (artifactIds.length > 0) {
		const { data: reviewerData } = await supabase
			.from('section_reviewers')
			.select('*, artifact:artifacts(id, title)')
			.in('artifact_id', artifactIds)
			.order('created_at', { ascending: false });
		reviewers = reviewerData ?? [];
	}

	// Load organization members for the add-member dropdown
	const { data: organizationMembers } = await supabase
		.from('organization_members')
		.select('profile_id, profile:profiles(first_name, last_name, email)')
		.eq('organization_id', project.organization_id);

	// Load uploaded documents for this project
	const { data: uploadedDocuments } = await supabase
		.from('documents')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	return {
		project,
		artifacts: artifacts ?? [],
		members: members ?? [],
		reviewers,
		organizationMembers: organizationMembers ?? [],
		uploadedDocuments: uploadedDocuments ?? []
	};
};
