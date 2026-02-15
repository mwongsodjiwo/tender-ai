// POST /api/chat — Send a message and get AI response

import type { RequestHandler } from './$types';
import { chatMessageSchema } from '$server/api/validation';
import { chat } from '$server/ai/client';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = chatMessageSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { conversation_id, message } = parsed.data;

	// Verify conversation exists and user has access
	const { data: conversation, error: convError } = await supabase
		.from('conversations')
		.select('id, project_id')
		.eq('id', conversation_id)
		.single();

	if (convError || !conversation) {
		return apiError(404, 'NOT_FOUND', 'Gesprek niet gevonden');
	}

	// Save user message
	const { error: userMsgError } = await supabase.from('messages').insert({
		conversation_id,
		role: 'user',
		content: message,
		created_by: user.id
	});

	if (userMsgError) {
		return apiError(500, 'DB_ERROR', userMsgError.message);
	}

	// Fetch conversation history
	const { data: history } = await supabase
		.from('messages')
		.select('role, content')
		.eq('conversation_id', conversation_id)
		.order('created_at', { ascending: true });

	// Call AI
	let aiResponse;
	try {
		aiResponse = await chat({
			messages: (history ?? []).map((msg) => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content
			}))
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'AI-fout';
		return apiError(500, 'INTERNAL_ERROR', `AI-fout: ${errorMessage}`);
	}

	// Save AI response
	const { data: aiMsg, error: aiMsgError } = await supabase
		.from('messages')
		.insert({
			conversation_id,
			role: 'assistant',
			content: aiResponse.content,
			token_count: aiResponse.tokenCount
		})
		.select('id')
		.single();

	if (aiMsgError) {
		return apiError(500, 'DB_ERROR', aiMsgError.message);
	}

	await logAudit(supabase, {
		projectId: conversation.project_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'message',
		entityId: aiMsg.id
	});

	return apiSuccess({
		message_id: aiMsg.id,
		content: aiResponse.content,
		conversation_id
	});
};
