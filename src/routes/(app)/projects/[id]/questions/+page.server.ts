// Questions page server load — fetch incoming questions for project

import type { PageServerLoad } from './$types';
import type { IncomingQuestion } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data, error } = await supabase
		.from('incoming_questions')
		.select('*')
		.eq('project_id', params.id)
		.order('question_number');

	return {
		questions: (data ?? []) as IncomingQuestion[],
		loadError: error?.message ?? null
	};
};
