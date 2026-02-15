// GET /api/projects/:id/contract/standard-text/:sectionKey — Get standard text for an article

import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Load project to get general_conditions setting
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, general_conditions')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	if (!project.general_conditions) {
		return apiError(400, 'VALIDATION_ERROR', 'Geen algemene voorwaarden geselecteerd');
	}

	// Look up standard text for this section and conditions type
	const { data: standardText, error: stError } = await supabase
		.from('contract_standard_texts')
		.select('id, section_key, general_conditions, title, content, sort_order')
		.eq('section_key', params.sectionKey)
		.eq('general_conditions', project.general_conditions)
		.eq('is_active', true)
		.single();

	if (stError || !standardText) {
		return apiError(404, 'NOT_FOUND', 'Geen standaardtekst beschikbaar voor dit artikel');
	}

	return apiSuccess(standardText);
};
