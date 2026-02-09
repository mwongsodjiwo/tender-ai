// GET /api/projects/:id/comments — List document comments
// POST /api/projects/:id/comments — Create a document comment

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDocumentCommentSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
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
		return json({ message: 'Fout bij ophalen opmerkingen', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: data ?? [] });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Ongeldige JSON', code: 'INVALID_JSON', status: 400 }, { status: 400 });
	}

	const parsed = createDocumentCommentSchema.safeParse(body);
	if (!parsed.success) {
		return json({
			message: 'Validatiefout',
			code: 'VALIDATION_ERROR',
			status: 400,
			errors: parsed.error.flatten().fieldErrors
		}, { status: 400 });
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
		return json({ message: 'Artifact niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
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
		return json({ message: 'Fout bij aanmaken opmerking', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		action: 'create',
		entityType: 'document_comment',
		entityId: data.id,
		projectId: params.id,
		actorId: user.id,
		changes: { artifact_id, selected_text_preview: selected_text.substring(0, 100) }
	});

	return json({ data }, { status: 201 });
};
