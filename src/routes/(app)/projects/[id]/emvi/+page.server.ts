// EMVI wegingstool — load scoring methodology and criteria

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load project scoring methodology
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, scoring_methodology, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	// Load all EMVI criteria
	const { data: criteria, error: critError } = await supabase
		.from('emvi_criteria')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('sort_order', { ascending: true });

	if (critError) {
		throw error(500, 'Kon EMVI-criteria niet laden');
	}

	return {
		scoringMethodology: project.scoring_methodology,
		criteria: criteria ?? []
	};
};
