// GET /api/projects/:id/comments — List document comments
// POST /api/projects/:id/comments — Create a document comment

import type { RequestHandler } from './$types';
import { createDocumentCommentSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const artifactId = url.searchParams.get('artifact_id');
	const resolved = url.searchParams.get('resolved');

	let query = supabase
		.from('document_comments')
		.select('*, author:profiles!document_comments_created_by_fkey(first_name, last_name, email)')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: true });

	if (artifactId) {
		query = query.eq('artifact_id', artifactId);
	}

	if (resolved !== null && resolved !== undefined) {
		query = query.eq('resolved', resolved === 'true');
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', 'Fout bij ophalen opmerkingen');
	}

	return apiSuccess(data ?? []);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError(400, 'VALIDATION_ERROR', 'Ongeldige JSON');
	}

	const parsed = createDocumentCommentSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', 'Validatiefout');
	}

	const { artifact_id, selected_text, comment_text } = parsed.data;

	// Verify artifact belongs to this project
	const { data: artifact, error: artifactError } = await supabase
		.from('artifacts')
		.select('id')
		.eq('id', artifact_id)
		.eq('project_id', params.id)
		.single();

	if (artifactError || !artifact) {
		return apiError(404, 'NOT_FOUND', 'Artifact niet gevonden');
	}

	const { data, error: insertError } = await supabase
		.from('document_comments')
		.insert({
			project_id: params.id,
			artifact_id,
			selected_text,
			comment_text,
			created_by: user.id
		})
		.select('*, author:profiles!document_comments_created_by_fkey(first_name, last_name, email)')
		.single();

	if (insertError) {
		return apiError(500, 'DB_ERROR', 'Fout bij aanmaken opmerking');
	}

	await logAudit(supabase, {
		action: 'create',
		entityType: 'document_comment',
		entityId: data.id,
		projectId: params.id,
		actorId: user.id,
		changes: { artifact_id, selected_text_preview: selected_text.substring(0, 100) }
	});

	return apiSuccess(data, 201);
};
