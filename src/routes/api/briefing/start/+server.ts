// POST /api/briefing/start — Start a briefing conversation for a project

import type { RequestHandler } from './$types';
import { briefingStartSchema } from '$server/api/validation';
import { conductBriefing } from '$server/ai/briefing';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = briefingStartSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { project_id } = parsed.data;

	// Verify project exists and user has access
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('id, name, organization_id, status')
		.eq('id', project_id)
		.is('deleted_at', null)
		.single();

	if (projectError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Update project status to briefing
	await supabase
		.from('projects')
		.update({ status: 'briefing' })
		.eq('id', project_id);

	// Create briefing conversation
	const { data: conversation, error: convError } = await supabase
		.from('conversations')
		.insert({
			project_id,
			title: 'Briefing',
			context_type: 'briefing',
			created_by: user.id
		})
		.select()
		.single();

	if (convError) {
		return apiError(500, 'DB_ERROR', convError.message);
	}

	// Generate first AI message (opening question)
	let aiResponse;
	try {
		aiResponse = await conductBriefing([
			{
				role: 'user',
				content: `Ik wil een briefing starten voor het project "${project.name}". Stel me de eerste vragen.`
			}
		]);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'AI-fout';
		return apiError(500, 'INTERNAL_ERROR', `AI-fout: ${errorMessage}`);
	}

	// Save system context message (hidden)
	await supabase.from('messages').insert({
		conversation_id: conversation.id,
		role: 'system',
		content: `Briefing gestart voor project: ${project.name}`,
		created_by: user.id
	});

	// Save AI opening message
	await supabase.from('messages').insert({
		conversation_id: conversation.id,
		role: 'assistant',
		content: aiResponse.content,
		token_count: aiResponse.tokenCount
	});

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: project_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'briefing',
		entityId: conversation.id
	});

	return apiSuccess({
		conversation_id: conversation.id,
		content: aiResponse.content,
		briefing_complete: false
	});
};
