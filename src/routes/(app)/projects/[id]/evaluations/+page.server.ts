// Beoordelingen overzichtspagina — load evaluations, EMVI criteria, and scoring methodology

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load project with scoring methodology
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, scoring_methodology, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	// Load evaluations sorted by ranking then name
	const { data: evaluations, error: evalError } = await supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('ranking', { ascending: true, nullsFirst: false })
		.order('tenderer_name', { ascending: true });

	if (evalError) {
		throw error(500, 'Kon beoordelingen niet laden');
	}

	// Load EMVI criteria sorted by sort_order
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
		evaluations: evaluations ?? [],
		criteria: criteria ?? [],
		scoringMethodology: project.scoring_methodology
	};
};
