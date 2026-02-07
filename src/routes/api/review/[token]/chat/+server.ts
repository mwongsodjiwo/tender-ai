// POST /api/review/:token/chat — Chat with AI about a section (magic link access, no auth)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reviewChatSchema } from '$server/api/validation';
import { chatWithReviewer } from '$server/ai/review';
import { createServiceClient } from '$server/db/client';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request }) => {
	const supabase = createServiceClient();

	// Validate token
	const { data: reviewer, error: reviewerError } = await supabase
		.from('section_reviewers')
		.select('*')
		.eq('token', params.token)
		.single();

	if (reviewerError || !reviewer) {
		return json(
			{ message: 'Ongeldige of verlopen reviewlink', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	if (new Date(reviewer.expires_at) < new Date()) {
		return json(
			{ message: 'Deze reviewlink is verlopen', code: 'EXPIRED', status: 410 },
			{ status: 410 }
		);
	}

	const body = await request.json();
	const parsed = reviewChatSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { conversation_id, message } = parsed.data;

	// Get artifact
	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('*')
		.eq('id', reviewer.artifact_id)
		.single();

	if (artError || !artifact) {
		return json(
			{ message: 'Sectie niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
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
			return json(
				{ message: 'Kon gesprek niet aanmaken', code: 'DB_ERROR', status: 500 },
				{ status: 500 }
			);
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
		return json(
			{ message: `AI-fout: ${errorMessage}`, code: 'AI_ERROR', status: 500 },
			{ status: 500 }
		);
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

	return json({
		data: {
			message_id: aiMsg?.id,
			content: result.content,
			conversation_id: convId,
			has_update: result.hasUpdate,
			updated_artifact: updatedArtifact
		}
	});
};
