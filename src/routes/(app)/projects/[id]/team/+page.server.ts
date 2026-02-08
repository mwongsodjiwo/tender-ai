// Team sub-page — load reviewers (kennishouders)

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load artifacts for reviewer assignment
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('id, title, section_key')
		.eq('project_id', params.id)
		.order('sort_order');

	const allArtifacts = artifacts ?? [];
	const artifactIds = allArtifacts.map((a) => a.id);

	// Load reviewers (kennishouders) for project artifacts
	let reviewers: unknown[] = [];
	if (artifactIds.length > 0) {
		const { data: reviewerData } = await supabase
			.from('section_reviewers')
			.select('*, artifact:artifacts(id, title)')
			.in('artifact_id', artifactIds)
			.order('created_at', { ascending: false });
		reviewers = reviewerData ?? [];
	}

	return {
		artifacts: allArtifacts,
		reviewers
	};
};
