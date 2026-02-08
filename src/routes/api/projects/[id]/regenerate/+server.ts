// POST /api/projects/:id/regenerate — Regenerate an artifact section with AI

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { regenerateSectionSchema } from '$server/api/validation';
import { regenerateSection } from '$server/ai/generation';
import { searchContext, formatContextForPrompt } from '$server/ai/context';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = regenerateSectionSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: 'Sectie niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Get document type
	const { data: documentType } = await supabase
		.from('document_types')
		.select('*')
		.eq('id', artifact.document_type_id)
		.single();

	if (!documentType) {
		return json({ message: 'Documenttype niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
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
		console.error('Context search failed during regeneration:', err instanceof Error ? err.message : err);
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
		return json({ message: `AI-fout: ${errorMessage}`, code: 'AI_ERROR', status: 500 }, { status: 500 });
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
		return json({ message: updateError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({
		data: {
			artifact: updated,
			previous_version: previousVersion,
			context_used: contextSnippets.length
		}
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
