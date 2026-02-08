// PvE eisenmanager — load requirements and PvE document type

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load PvE document type
	const { data: pveDocType, error: dtError } = await supabase
		.from('document_types')
		.select('id, name, slug, description')
		.eq('slug', 'programma-van-eisen')
		.single();

	if (dtError || !pveDocType) {
		throw error(404, 'Documenttype Programma van Eisen niet gevonden');
	}

	// Load all requirements for this project
	const { data: requirements, error: reqError } = await supabase
		.from('requirements')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('category')
		.order('sort_order', { ascending: true });

	if (reqError) {
		throw error(500, 'Kon eisen niet laden');
	}

	return {
		pveDocType,
		requirements: requirements ?? []
	};
};
