// GET /api/projects/:id/conversations — List project conversations
// POST /api/projects/:id/conversations — Create a conversation

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createConversationSchema } from '$server/api/validation';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('conversations')
		.select('*, messages(count)')
		.eq('project_id', params.id)
		.order('updated_at', { ascending: false });

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createConversationSchema.safeParse({ ...body, project_id: params.id });

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { project_id, artifact_id, title, context_type } = parsed.data;

	const { data: conversation, error: dbError } = await supabase
		.from('conversations')
		.insert({
			project_id,
			artifact_id: artifact_id ?? null,
			title: title ?? null,
			context_type: context_type ?? 'general',
			created_by: user.id
		})
		.select()
		.single();

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: conversation }, { status: 201 });
};
