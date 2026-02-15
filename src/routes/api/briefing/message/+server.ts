// POST /api/briefing/message — Send a message in briefing conversation

import type { RequestHandler } from './$types';
import { briefingMessageSchema } from '$server/api/validation';
import { conductBriefing, generateArtifacts } from '$server/ai/briefing';
import { logAudit } from '$server/db/audit';
import { createServiceClient } from '$server/db/client';
import type { DocumentType } from '$types';
import { apiError, apiSuccess } from '$server/api/response';

/**
 * Background artifact generation — runs after the HTTP response is sent.
 * Uses a service client so it doesn't depend on the user's request lifecycle.
 */
async function generateArtifactsInBackground(
	projectId: string,
	briefingData: Record<string, unknown>,
	userId: string,
	userEmail: string | undefined
): Promise<void> {
	const serviceClient = createServiceClient();

	try {
		const { data: project } = await serviceClient
			.from('projects')
			.select('name, procedure_type, organization_id')
			.eq('id', projectId)
			.single();

		const { data: documentTypes } = await serviceClient
			.from('document_types')
			.select('*')
			.eq('is_active', true)
			.order('sort_order');

		const applicableTypes = (documentTypes ?? []).filter((dt: DocumentType) => {
			if (!project?.procedure_type) return true;
			return dt.applicable_procedures.length === 0 ||
				dt.applicable_procedures.includes(project.procedure_type);
		});

		let artifactsGenerated = 0;

		// Generate artifacts sequentially to respect API rate limits
		for (const docType of applicableTypes) {
			try {
				const sections = await generateArtifacts({
					briefingData,
					documentType: docType,
					projectName: project?.name ?? 'Onbekend project'
				});

				for (let i = 0; i < sections.length; i++) {
					const section = sections[i];
					await serviceClient.from('artifacts').insert({
						project_id: projectId,
						document_type_id: docType.id,
						section_key: section.sectionKey,
						title: section.title,
						content: section.content,
						status: 'generated',
						sort_order: i,
						created_by: userId
					});
					artifactsGenerated++;
				}
				console.log(`Generated ${sections.length} sections for ${docType.name}`);
			} catch (err) {
				console.error(`Failed to generate artifacts for ${docType.name}:`, err);
			}
		}

		// Update project status to review
		await serviceClient
			.from('projects')
			.update({ status: 'review' })
			.eq('id', projectId);

		await logAudit(serviceClient, {
			organizationId: project?.organization_id,
			projectId,
			actorId: userId,
			actorEmail: userEmail,
			action: 'generate',
			entityType: 'artifacts',
			changes: { artifacts_generated: artifactsGenerated }
		});

		console.log(`Background generation complete: ${artifactsGenerated} artifacts for project ${projectId}`);
	} catch (err) {
		console.error('Background artifact generation failed:', err);
		// Set project back to briefing so user can retry
		await serviceClient
			.from('projects')
			.update({ status: 'briefing' })
			.eq('id', projectId);
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = briefingMessageSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { project_id, conversation_id, message } = parsed.data;

	// Verify conversation exists
	const { data: conversation, error: convError } = await supabase
		.from('conversations')
		.select('id, project_id, context_type')
		.eq('id', conversation_id)
		.eq('project_id', project_id)
		.single();

	if (convError || !conversation) {
		return apiError(404, 'NOT_FOUND', 'Gesprek niet gevonden');
	}

	// Save user message
	await supabase.from('messages').insert({
		conversation_id,
		role: 'user',
		content: message,
		created_by: user.id
	});

	// Fetch conversation history (exclude system messages for AI context)
	const { data: history } = await supabase
		.from('messages')
		.select('role, content')
		.eq('conversation_id', conversation_id)
		.neq('role', 'system')
		.order('created_at', { ascending: true });

	// Call briefing AI
	let aiResponse;
	try {
		aiResponse = await conductBriefing(
			(history ?? []).map((msg) => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content
			}))
		);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'AI-fout';
		return apiError(500, 'INTERNAL_ERROR', `AI-fout: ${errorMessage}`);
	}

	// Save AI response
	const { data: aiMsg } = await supabase
		.from('messages')
		.insert({
			conversation_id,
			role: 'assistant',
			content: aiResponse.content,
			token_count: aiResponse.tokenCount
		})
		.select('id')
		.single();

	// If briefing is complete, kick off background generation
	if (aiResponse.isComplete) {
		// Update project with briefing data and status
		await supabase
			.from('projects')
			.update({
				briefing_data: aiResponse.briefingData,
				status: 'generating'
			})
			.eq('id', project_id);

		// Fire-and-forget: generate artifacts in background
		generateArtifactsInBackground(
			project_id,
			aiResponse.briefingData,
			user.id,
			user.email ?? undefined
		).catch((err) => console.error('Unhandled background generation error:', err));
	}

	return apiSuccess({
		message_id: aiMsg?.id ?? '',
		content: aiResponse.content,
		conversation_id,
		briefing_complete: aiResponse.isComplete,
		artifacts_generated: 0
	});
};
