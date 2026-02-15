// POST /api/review/:token/chat — Chat with AI about a section (magic link access, no auth)

import type { RequestHandler } from './$types';
import { reviewChatSchema } from '$server/api/validation';
import { chatWithReviewer } from '$server/ai/review';
import { createServiceClient } from '$server/db/client';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request }) => {
	const supabase = createServiceClient();

	// Validate token
	const { data: reviewer, error: reviewerError } = await supabase
		.from('section_reviewers')
		.select('*')
		.eq('token', params.token)
		.single();

	if (reviewerError || !reviewer) {
		return apiError(404, 'NOT_FOUND', 'Ongeldige of verlopen reviewlink');
	}

	if (new Date(reviewer.expires_at) < new Date()) {
		return apiError(410, 'NOT_FOUND', 'Deze reviewlink is verlopen');
	}

	const body = await request.json();
	const parsed = reviewChatSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { conversation_id, message } = parsed.data;

	// Get artifact
	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('*')
		.eq('id', reviewer.artifact_id)
		.single();

	if (artError || !artifact) {
		return apiError(404, 'NOT_FOUND', 'Sectie niet gevonden');
	}

	// Get or create conversation
	let convId = conversation_id;

	if (!convId) {
		const { data: newConv, error: convError } = await supabase
			.from('conversations')
			.insert({
				project_id: artifact.project_id,
				artifact_id: artifact.id,
				context_type: 'review_chat',
				title: `Review: ${artifact.title} — ${reviewer.name}`,
				created_by: artifact.created_by ?? artifact.project_id
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
		content: message
	});

	// Load conversation history
	const { data: history } = await supabase
		.from('messages')
		.select('role, content')
		.eq('conversation_id', convId)
		.order('created_at', { ascending: true });

	// Call review AI agent
	let result;
	try {
		result = await chatWithReviewer({
			artifact,
			messages: (history ?? []).map((msg) => ({
				role: msg.role,
				content: msg.content
			})),
			reviewerName: reviewer.name
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

		const { data: updated } = await supabase
			.from('artifacts')
			.update({
				content: result.updatedContent,
				version: artifact.version + 1,
				status: 'review'
			})
			.eq('id', artifact.id)
			.select()
			.single();

		updatedArtifact = updated;

		const { data: project } = await supabase
			.from('projects')
			.select('organization_id')
			.eq('id', artifact.project_id)
			.single();

		await logAudit(supabase, {
			organizationId: project?.organization_id,
			projectId: artifact.project_id,
			actorEmail: reviewer.email,
			action: 'update',
			entityType: 'artifact',
			entityId: artifact.id,
			changes: {
				source: 'review_chat',
				reviewer_name: reviewer.name,
				previous_version: artifact.version
			}
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
