// PATCH /api/projects/:id/comments/:commentId — Update/resolve comment
// DELETE /api/projects/:id/comments/:commentId — Soft delete comment

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateDocumentCommentSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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

	const parsed = updateDocumentCommentSchema.safeParse(body);
	if (!parsed.success) {
		return json({
			message: 'Validatiefout',
			code: 'VALIDATION_ERROR',
			status: 400,
			errors: parsed.error.flatten().fieldErrors
		}, { status: 400 });
	}

	const updates: Record<string, unknown> = {};

	if (parsed.data.comment_text !== undefined) {
		updates.comment_text = parsed.data.comment_text;
	}

	if (parsed.data.resolved !== undefined) {
		updates.resolved = parsed.data.resolved;
		if (parsed.data.resolved) {
			updates.resolved_at = new Date().toISOString();
			updates.resolved_by = user.id;
		} else {
			updates.resolved_at = null;
			updates.resolved_by = null;
		}
	}

	if (Object.keys(updates).length === 0) {
		return json({ message: 'Geen wijzigingen opgegeven', code: 'NO_CHANGES', status: 400 }, { status: 400 });
	}

	const { data, error: updateError } = await supabase
		.from('document_comments')
		.update(updates)
		.eq('id', params.commentId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.select('*, author:profiles!document_comments_created_by_fkey(first_name, last_name, email)')
		.single();

	if (updateError || !data) {
		return json({ message: 'Opmerking niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const auditAction = parsed.data.resolved ? 'approve' : 'update';
	await logAudit(supabase, {
		action: auditAction,
		entityType: 'document_comment',
		entityId: data.id,
		projectId: params.id,
		actorId: user.id,
		changes: { resolved: parsed.data.resolved }
	});

	return json({ data });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Soft delete
	const { data, error: deleteError } = await supabase
		.from('document_comments')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.commentId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.select('id')
		.single();

	if (deleteError || !data) {
		return json({ message: 'Opmerking niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	await logAudit(supabase, {
		action: 'delete',
		entityType: 'document_comment',
		entityId: data.id,
		projectId: params.id,
		actorId: user.id
	});

	return json({ message: 'Opmerking verwijderd' });
};
