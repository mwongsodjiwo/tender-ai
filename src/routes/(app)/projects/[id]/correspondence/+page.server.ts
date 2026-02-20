// Correspondence overview — loads project and letters
// Fase 17 redirect removed: correspondence page functions independently

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const [projectResult, lettersResult] = await Promise.all([
		supabase
			.from('projects')
			.select('id, name, status, organization_id')
			.eq('id', params.id)
			.single(),
		supabase
			.from('correspondence')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
	]);

	return {
		project: projectResult.data ?? { id: params.id, name: '', status: 'draft', organization_id: '' },
		letters: lettersResult.data ?? [],
		evaluations: []
	};
};
