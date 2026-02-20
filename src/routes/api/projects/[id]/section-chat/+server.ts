// POST /api/projects/:id/section-chat — Chat about a specific artifact section

import type { RequestHandler } from './$types';
import { sectionChatSchema } from '$server/api/validation';
import { chatAboutSection } from '$server/ai/generation';
import { searchContext, formatContextForPrompt } from '$server/ai/context';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';
import { logError } from '$server/logger';
import { markdownToTiptapHtml } from '$utils/markdown-to-tiptap';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = sectionChatSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { artifact_id, conversation_id, message } = parsed.data;

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

	// Get project org for context scoping
	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', params.id)
		.single();

	// Search relevant context from uploaded documents for this conversation
	let contextBlock = '';
	try {
		const contextResults = await searchContext({
			supabase,
			query: `${artifact.title} ${message}`,
			projectId: params.id,
			organizationId: project?.organization_id,
			limit: 3
		});

		contextBlock = formatContextForPrompt(contextResults);
	} catch (err) {
		// Context search failure should not block the chat
		logError('Context search failed during section chat', err instanceof Error ? err.message : err);
	}

	// Get or create conversation
	let convId = conversation_id;

	if (!convId) {
		const { data: newConv, error: convError } = await supabase
			.from('conversations')
			.insert({
				project_id: params.id,
				artifact_id,
				context_type: 'section_chat',
				title: `Chat: ${artifact.title}`,
				created_by: user.id
			})
			.select('id')
			.single();

		if (convError || !newConv) {
			return apiError(500, 'DB_ERROR', 'Kon gesprek niet aanmaken');
		}
		convId = newConv.id;
	}

	// Save user message
	await supabase.from('messages').insert({
		conversation_id: convId,
		role: 'user',
		content: message,
		created_by: user.id
	});

	// Load conversation history
	const { data: history } = await supabase
		.from('messages')
		.select('role, content')
		.eq('conversation_id', convId)
		.order('created_at', { ascending: true });

	// Call AI with RAG context injected into the artifact
	let result;
	try {
		const artifactWithContext = contextBlock
			? { ...artifact, content: `${artifact.content}${contextBlock}` }
			: artifact;

		result = await chatAboutSection({
			artifact: artifactWithContext,
			messages: (history ?? []).map((msg) => ({
				role: msg.role,
				content: msg.content
			}))
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'AI-fout';
		return apiError(500, 'INTERNAL_ERROR', `AI-fout: ${errorMessage}`);
	}

	// Save AI response
	const { data: aiMsg } = await supabase
		.from('messages')
		.insert({
			conversation_id: convId,
			role: 'assistant',
			content: result.content,
			token_count: result.tokenCount
		})
		.select('id')
		.single();

	// If AI suggested an update, apply it
	let updatedArtifact = null;
	if (result.hasUpdate && result.updatedContent) {
		// Save current version
		await supabase.from('artifact_versions').insert({
			artifact_id: artifact.id,
			version: artifact.version,
			title: artifact.title,
			content: artifact.content,
			created_by: artifact.created_by
		});

		const htmlContent = await markdownToTiptapHtml(result.updatedContent);

		const { data: updated } = await supabase
			.from('artifacts')
			.update({
				content: htmlContent,
				version: artifact.version + 1,
				status: 'generated'
			})
			.eq('id', artifact_id)
			.select()
			.single();

		updatedArtifact = updated;

		await logAudit(supabase, {
			organizationId: project?.organization_id,
			projectId: params.id,
			actorId: user.id,
			actorEmail: user.email ?? undefined,
			action: 'update',
			entityType: 'artifact',
			entityId: artifact_id,
			changes: { source: 'section_chat', previous_version: artifact.version }
		});
	}

	return apiSuccess({
		message_id: aiMsg?.id,
		content: result.content,
		conversation_id: convId,
		has_update: result.hasUpdate,
		updated_artifact: updatedArtifact
	});
};
