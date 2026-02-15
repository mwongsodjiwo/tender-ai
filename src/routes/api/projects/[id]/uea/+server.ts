// GET /api/projects/:id/uea — Load all UEA sections + questions with project selections

import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Verify project exists and user has access
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Load all UEA sections ordered by sort_order
	const { data: sections, error: secError } = await supabase
		.from('uea_sections')
		.select('*')
		.eq('is_active', true)
		.order('sort_order');

	if (secError) {
		return apiError(500, 'DB_ERROR', secError.message);
	}

	// Load all UEA questions ordered by section + sort_order
	const { data: questions, error: qError } = await supabase
		.from('uea_questions')
		.select('*')
		.eq('is_active', true)
		.order('sort_order');

	if (qError) {
		return apiError(500, 'DB_ERROR', qError.message);
	}

	// Load project-specific selections
	const { data: selections } = await supabase
		.from('uea_project_selections')
		.select('*')
		.eq('project_id', params.id);

	const selectionMap = new Map(
		(selections ?? []).map((s: { question_id: string; is_selected: boolean }) => [s.question_id, s.is_selected])
	);

	// Combine questions with their selection state
	const allQuestions = questions ?? [];
	const questionsWithSelection = allQuestions.map((q) => ({
		...q,
		is_selected: q.is_mandatory ? true : (selectionMap.get(q.id) ?? false)
	}));

	// Group questions by section
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

	// Calculate metrics
	const totalQuestions = questionsWithSelection.length;
	const mandatoryCount = questionsWithSelection.filter((q) => q.is_mandatory).length;
	const optionalCount = totalQuestions - mandatoryCount;
	const selectedCount = questionsWithSelection.filter((q) => q.is_selected).length;

	return apiSuccess({
		sections: sectionsWithQuestions,
		metrics: {
			total: totalQuestions,
			mandatory: mandatoryCount,
			optional: optionalCount,
			selected: selectedCount
		}
	});
};
