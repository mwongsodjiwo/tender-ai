// Brief-editor pagina — load correspondence letter, project profile, and evaluations

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Correspondence, Evaluation, ProjectProfile } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load letter
	const { data: letterData, error: letterError } = await supabase
		.from('correspondence')
		.select('*')
		.eq('id', params.letterId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (letterError || !letterData) {
		throw error(404, 'Brief niet gevonden');
	}

	const letter = letterData as Correspondence;

	// Load project profile
	const { data: profileData } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	const projectProfile: ProjectProfile | null = profileData as ProjectProfile | null;

	// Load evaluations (for rejection/award letter context)
	const { data: evaluationsData } = await supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('ranking', { ascending: true });

	const evaluations: Evaluation[] = (evaluationsData ?? []) as Evaluation[];

	return {
		letter,
		projectProfile,
		evaluations
	};
};
