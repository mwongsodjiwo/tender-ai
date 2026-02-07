// POST /api/chat — Send a message and get AI response

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chatMessageSchema } from '$server/api/validation';
import { chat } from '$server/ai/client';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = chatMessageSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { conversation_id, message } = parsed.data;

	// Verify conversation exists and user has access
	const { data: conversation, error: convError } = await supabase
		.from('conversations')
		.select('id, project_id')
		.eq('id', conversation_id)
		.single();

	if (convError || !conversation) {
		return json(
			{ message: 'Gesprek niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	// Save user message
	const { error: userMsgError } = await supabase.from('messages').insert({
		conversation_id,
		role: 'user',
		content: message,
		created_by: user.id
	});

	if (userMsgError) {
		return json(
			{ message: userMsgError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
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
		return json(
			{ message: `AI-fout: ${errorMessage}`, code: 'AI_ERROR', status: 500 },
			{ status: 500 }
		);
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
		return json(
			{ message: aiMsgError.message, code: 'DB_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	await logAudit(supabase, {
		projectId: conversation.project_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'message',
		entityId: aiMsg.id
	});

	return json({
		data: {
			message_id: aiMsg.id,
			content: aiResponse.content,
			conversation_id
		}
	});
};
