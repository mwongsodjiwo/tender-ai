// POST /api/projects/:id/regenerate — Regenerate an artifact section with AI

import type { RequestHandler } from './$types';
import { regenerateSectionSchema } from '$server/api/validation';
import { regenerateSection } from '$server/ai/generation';
import { searchContext, formatContextForPrompt } from '$server/ai/context';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';
import { logError } from '$server/logger';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = regenerateSectionSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { artifact_id, instructions } = parsed.data;

	// Get artifact
	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('*')
		.eq('id', artifact_id)
		.eq('project_id', params.id)
		.single();

	if (artError || !artifact) {
		return apiError(404, 'NOT_FOUND', 'Sectie niet gevonden');
	}

	// Get document type
	const { data: documentType } = await supabase
		.from('document_types')
		.select('*')
		.eq('id', artifact.document_type_id)
		.single();

	if (!documentType) {
		return apiError(404, 'NOT_FOUND', 'Documenttype niet gevonden');
	}

	// Get project briefing data
	const { data: project } = await supabase
		.from('projects')
		.select('briefing_data, organization_id')
		.eq('id', params.id)
		.single();

	// Search for relevant context from uploaded documents via RAG
	const contextQuery = buildContextQuery(artifact.title, instructions, project?.briefing_data);
	let contextSnippets: string[] = [];

	try {
		const contextResults = await searchContext({
			supabase,
			query: contextQuery,
			projectId: params.id,
			organizationId: project?.organization_id,
			limit: 5
		});

		if (contextResults.length > 0) {
			contextSnippets = contextResults.map((r) =>
				`[${r.source === 'document' ? 'Document' : 'TenderNed'}: ${r.title}]\n${r.snippet}`
			);
		}
	} catch (err) {
		// Context search failure should not block generation
		logError('Context search failed during regeneration', err instanceof Error ? err.message : err);
	}

	// Save current version before regeneration
	await supabase.from('artifact_versions').insert({
		artifact_id: artifact.id,
		version: artifact.version,
		title: artifact.title,
		content: artifact.content,
		created_by: artifact.created_by
	});

	const previousVersion = artifact.version;

	// Regenerate with context from RAG
	let result;
	try {
		result = await regenerateSection({
			artifact,
			documentType,
			briefingData: project?.briefing_data ?? {},
			instructions,
			contextSnippets
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Generatiefout';
		return apiError(500, 'INTERNAL_ERROR', `AI-fout: ${errorMessage}`);
	}

	// Update artifact with new content
	const { data: updated, error: updateError } = await supabase
		.from('artifacts')
		.update({
			content: result.content,
			version: artifact.version + 1,
			status: 'generated'
		})
		.eq('id', artifact_id)
		.select()
		.single();

	if (updateError) {
		return apiError(500, 'DB_ERROR', updateError.message);
	}

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'generate',
		entityType: 'artifact',
		entityId: artifact_id,
		changes: {
			previous_version: previousVersion,
			new_version: updated.version,
			instructions,
			context_snippets_used: contextSnippets.length
		}
	});

	return apiSuccess({
		artifact: updated,
		previous_version: previousVersion,
		context_used: contextSnippets.length
	});
};

function buildContextQuery(
	sectionTitle: string,
	instructions: string | undefined,
	briefingData: Record<string, unknown> | undefined
): string {
	const parts = [sectionTitle];

	if (instructions) {
		parts.push(instructions);
	}

	if (briefingData) {
		const summary = briefingData.summary ?? briefingData.project_description ?? '';
		if (typeof summary === 'string' && summary.length > 0) {
			parts.push(summary.substring(0, 200));
		}
	}

	return parts.join(' — ');
}
