// Inschrijver detailpagina — load single evaluation, EMVI criteria, and scoring methodology

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

	// Load evaluation
	const { data: evaluation, error: evalError } = await supabase
		.from('evaluations')
		.select('*')
		.eq('id', params.evaluationId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (evalError || !evaluation) {
		throw error(404, 'Beoordeling niet gevonden');
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
		evaluation,
		criteria: criteria ?? [],
		scoringMethodology: project.scoring_methodology
	};
};
