// GET /api/projects/:id/conversations — List project conversations
// POST /api/projects/:id/conversations — Create a conversation

import type { RequestHandler } from './$types';
import { createConversationSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('conversations')
		.select('*, messages(count)')
		.eq('project_id', params.id)
		.order('updated_at', { ascending: false });

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createConversationSchema.safeParse({ ...body, project_id: params.id });

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
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
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(conversation, 201);
};
