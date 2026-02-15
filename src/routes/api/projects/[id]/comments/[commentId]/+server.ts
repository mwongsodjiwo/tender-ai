// PATCH /api/projects/:id/comments/:commentId — Update/resolve comment
// DELETE /api/projects/:id/comments/:commentId — Soft delete comment

import type { RequestHandler } from './$types';
import { updateDocumentCommentSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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

	const parsed = updateDocumentCommentSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', 'Validatiefout');
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
		return apiError(400, 'VALIDATION_ERROR', 'Geen wijzigingen opgegeven');
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
		return apiError(404, 'NOT_FOUND', 'Opmerking niet gevonden');
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

	return apiSuccess(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
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
		return apiError(404, 'NOT_FOUND', 'Opmerking niet gevonden');
	}

	await logAudit(supabase, {
		action: 'delete',
		entityType: 'document_comment',
		entityId: data.id,
		projectId: params.id,
		actorId: user.id
	});

	return apiSuccess({ message: 'Opmerking verwijderd' });
};
