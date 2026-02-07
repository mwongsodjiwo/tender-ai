// POST /api/briefing/message — Send a message in briefing conversation

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { briefingMessageSchema } from '$server/api/validation';
import { conductBriefing, generateArtifacts } from '$server/ai/briefing';
import { logAudit } from '$server/db/audit';
import type { DocumentType } from '$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = briefingMessageSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json(
			{ message: 'Gesprek niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
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
		return json({ message: `AI-fout: ${errorMessage}`, code: 'AI_ERROR', status: 500 }, { status: 500 });
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

	let artifactsGenerated = 0;

	// If briefing is complete, generate artifacts
	if (aiResponse.isComplete) {
		// Update project with briefing data and status
		await supabase
			.from('projects')
			.update({
				briefing_data: aiResponse.briefingData,
				status: 'generating'
			})
			.eq('id', project_id);

		// Get project info
		const { data: project } = await supabase
			.from('projects')
			.select('name, procedure_type, organization_id')
			.eq('id', project_id)
			.single();

		// Get applicable document types
		const { data: documentTypes } = await supabase
			.from('document_types')
			.select('*')
			.eq('is_active', true)
			.order('sort_order');

		// Filter document types by procedure type if set
		const applicableTypes = (documentTypes ?? []).filter((dt: DocumentType) => {
			if (!project?.procedure_type) return true;
			return dt.applicable_procedures.length === 0 ||
				dt.applicable_procedures.includes(project.procedure_type);
		});

		// Generate artifacts sequentially to respect API rate limits
		for (const docType of applicableTypes) {
			try {
				const sections = await generateArtifacts({
					briefingData: aiResponse.briefingData,
					documentType: docType,
					projectName: project?.name ?? 'Onbekend project'
				});

				for (let i = 0; i < sections.length; i++) {
					const section = sections[i];
					await supabase.from('artifacts').insert({
						project_id,
						document_type_id: docType.id,
						section_key: section.sectionKey,
						title: section.title,
						content: section.content,
						status: 'generated',
						sort_order: i,
						created_by: user.id
					});
					artifactsGenerated++;
				}
			} catch (err) {
				console.error(`Failed to generate artifacts for ${docType.name}:`, err);
			}
		}

		// Update project status to review
		await supabase
			.from('projects')
			.update({ status: 'review' })
			.eq('id', project_id);

		await logAudit(supabase, {
			organizationId: project?.organization_id,
			projectId: project_id,
			actorId: user.id,
			actorEmail: user.email ?? undefined,
			action: 'generate',
			entityType: 'artifacts',
			changes: { artifacts_generated: artifactsGenerated }
		});
	}

	return json({
		data: {
			message_id: aiMsg?.id ?? '',
			content: aiResponse.content,
			conversation_id,
			briefing_complete: aiResponse.isComplete,
			artifacts_generated: artifactsGenerated
		}
	});
};
