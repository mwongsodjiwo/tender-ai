// UEA configurator — load all sections, questions, and project selections

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load all UEA sections
	const { data: sections, error: secError } = await supabase
		.from('uea_sections')
		.select('*')
		.eq('is_active', true)
		.order('sort_order');

	if (secError) {
		throw error(500, 'Kon UEA-secties niet laden');
	}

	// Load all UEA questions
	const { data: questions, error: qError } = await supabase
		.from('uea_questions')
		.select('*')
		.eq('is_active', true)
		.order('sort_order');

	if (qError) {
		throw error(500, 'Kon UEA-vragen niet laden');
	}

	// Load project selections
	const { data: selections } = await supabase
		.from('uea_project_selections')
		.select('*')
		.eq('project_id', params.id);

	// Build selection map
	const selectionMap = new Map(
		(selections ?? []).map((s: { question_id: string; is_selected: boolean }) => [s.question_id, s.is_selected])
	);

	// Combine questions with selection state
	const allQuestions = questions ?? [];
	const questionsWithSelection = allQuestions.map((q) => ({
		...q,
		is_selected: q.is_mandatory ? true : (selectionMap.get(q.id) ?? false)
	}));

	// Group questions by section_id
	const questionsBySection = new Map<string, typeof questionsWithSelection>();
	for (const q of questionsWithSelection) {
		const sectionId = q.section_id;
		if (!questionsBySection.has(sectionId)) {
			questionsBySection.set(sectionId, []);
		}
		questionsBySection.get(sectionId)!.push(q);
	}

	// Build sections with nested questions
	const sectionsWithQuestions = (sections ?? []).map((s: { id: string }) => ({
		...s,
		questions: questionsBySection.get(s.id) ?? []
	}));

	return {
		sections: sectionsWithQuestions,
		hasSelections: (selections ?? []).length > 0
	};
};
