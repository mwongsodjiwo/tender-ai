// GET /api/projects/:id/contract/standard-text/:sectionKey — Get standard text for an article

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Load project to get general_conditions setting
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, general_conditions')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	if (!project.general_conditions) {
		return json(
			{ message: 'Geen algemene voorwaarden geselecteerd', code: 'NO_CONDITIONS', status: 400 },
			{ status: 400 }
		);
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
		return json(
			{ message: 'Geen standaardtekst beschikbaar voor dit artikel', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	return json({ data: standardText });
};
