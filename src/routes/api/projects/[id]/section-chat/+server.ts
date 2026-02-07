// POST /api/projects/:id/section-chat — Chat about a specific artifact section

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sectionChatSchema } from '$server/api/validation';
import { chatAboutSection } from '$server/ai/generation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = sectionChatSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: 'Sectie niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
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
			return json({ message: 'Kon gesprek niet aanmaken', code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	// Call AI
	let result;
	try {
		result = await chatAboutSection({
			artifact,
			messages: (history ?? []).map((msg) => ({
				role: msg.role,
				content: msg.content
			}))
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'AI-fout';
		return json({ message: `AI-fout: ${errorMessage}`, code: 'AI_ERROR', status: 500 }, { status: 500 });
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
				status: 'generated'
			})
			.eq('id', artifact_id)
			.select()
			.single();

		updatedArtifact = updated;

		const { data: project } = await supabase
			.from('projects')
			.select('organization_id')
			.eq('id', params.id)
			.single();

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
