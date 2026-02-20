// POST /api/projects/:id/correspondence/generate — Generate letter with AI

import type { RequestHandler } from './$types';
import { generateLetterSchema } from '$server/api/validation';
import { generateLetter } from '$server/ai/generation';
import { searchContext, formatContextForPrompt } from '$server/ai/context';
import { logAudit } from '$server/db/audit';
import type { ProjectPhase } from '$types';
import { logError } from '$server/logger';
import { apiError, apiSuccess } from '$server/api/response';
import { markdownToTiptapHtml } from '$utils/markdown-to-tiptap';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Load project
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, organization_id, status')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Validate request body
	const body = await request.json();
	const parsed = generateLetterSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Load project profile (required for letter generation)
	const { data: profile, error: profileError } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	if (profileError || !profile) {
		return apiError(400, 'VALIDATION_ERROR', 'Projectprofiel niet gevonden. Vul eerst het projectprofiel in.');
	}

	// Determine phase from project profile or default to tendering
	const phase: ProjectPhase = (profile.phase as ProjectPhase) || 'tendering';

	// If evaluation_id is provided, load evaluation data (for rejection/award letters)
	let evaluationData: { tendererName: string; scores: Record<string, unknown>; totalScore: number; ranking?: number } | undefined;

	if (parsed.data.evaluation_id) {
		const { data: evaluation, error: evalError } = await supabase
			.from('evaluations')
			.select('*')
			.eq('id', parsed.data.evaluation_id)
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.single();

		if (evalError || !evaluation) {
			return apiError(404, 'NOT_FOUND', 'Evaluatie niet gevonden');
		}

		evaluationData = {
			tendererName: evaluation.tenderer_name,
			scores: evaluation.scores as Record<string, unknown>,
			totalScore: evaluation.total_score,
			ranking: evaluation.ranking ?? undefined
		};
	}

	// Optional: search knowledge base for context
	let knowledgeBaseContext: string | undefined;
	try {
		const contextResults = await searchContext({
			supabase,
			query: `${parsed.data.letter_type} ${project.name}`,
			projectId: params.id,
			organizationId: project.organization_id,
			limit: 3
		});
		if (contextResults.length > 0) {
			knowledgeBaseContext = formatContextForPrompt(contextResults);
		}
	} catch {
		// Context search is optional — continue without it
	}

	// Generate letter with AI
	let result;
	try {
		result = await generateLetter({
			letterType: parsed.data.letter_type,
			phase,
			projectProfile: profile as Record<string, unknown>,
			recipient: parsed.data.recipient,
			evaluationData,
			knowledgeBaseContext,
			instructions: parsed.data.instructions
		});
	} catch (err) {
		logError('Letter generation failed', err);
		return apiError(500, 'INTERNAL_ERROR', 'Brief generatie mislukt. Probeer het opnieuw.');
	}

	// Audit log
	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'generate',
		entityType: 'correspondence',
		entityId: params.id,
		changes: { letter_type: parsed.data.letter_type, token_count: result.tokenCount }
	});

	// Convert markdown body to TipTap HTML
	const htmlBody = await markdownToTiptapHtml(result.body);

	// Return generated content — caller is responsible for saving
	return apiSuccess({
		subject: result.subject,
		body: htmlBody,
		recipient: parsed.data.recipient || evaluationData?.tendererName || ''
	});
};
