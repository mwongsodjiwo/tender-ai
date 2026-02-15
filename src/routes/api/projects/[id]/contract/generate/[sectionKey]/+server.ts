// POST /api/projects/:id/contract/generate/:sectionKey — Generate article text
// Uses standard text as base, AI generation will be added when AI module is available

import type { RequestHandler } from './$types';
import { generateContractArticleSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json().catch(() => ({}));
	const parsed = generateContractArticleSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Load project context
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, description, contract_type, general_conditions, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const sectionKey = params.sectionKey;

	// Use standard text as generated content when conditions are set
	if (project.general_conditions) {
		const { data: standardText } = await supabase
			.from('contract_standard_texts')
			.select('content')
			.eq('section_key', sectionKey)
			.eq('general_conditions', project.general_conditions)
			.eq('is_active', true)
			.single();

		if (standardText) {
			await logAudit(supabase, {
				organizationId: project.organization_id,
				projectId: params.id,
				actorId: user.id,
				actorEmail: user.email ?? undefined,
				action: 'generate',
				entityType: 'contract_article',
				changes: {
					section_key: sectionKey,
					general_conditions: project.general_conditions,
					has_instructions: !!parsed.data.instructions
				}
			});

			return apiSuccess({
				content: standardText.content,
				section_key: sectionKey
			});
		}
	}

	return apiError(400, 'VALIDATION_ERROR', 'Selecteer eerst algemene voorwaarden om artikeltekst te genereren.');
};
