// Correspondentie overzichtspagina — load correspondence list and evaluations

import type { PageServerLoad } from './$types';
import type { Correspondence, Evaluation } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load all correspondence for this project
	const { data: lettersData } = await supabase
		.from('correspondence')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const letters: Correspondence[] = (lettersData ?? []) as Correspondence[];

	// Load evaluations (for context with rejection letters)
	const { data: evaluationsData } = await supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('ranking', { ascending: true });

	const evaluations: Evaluation[] = (evaluationsData ?? []) as Evaluation[];

	// Load project profile for phase context
	const { data: profileData } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	return {
		letters,
		evaluations,
		projectProfile: profileData
	};
};
