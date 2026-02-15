// GET /api/projects/:id/uploads/:documentId — Get document metadata
// DELETE /api/projects/:id/uploads/:documentId — Soft delete document

import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';
import { createServiceClient } from '$server/db/client';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('documents')
		.select('*')
		.eq('id', params.documentId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !data) {
		return apiError(404, 'NOT_FOUND', 'Document niet gevonden');
	}

	return apiSuccess(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Get document to find organization_id and file_path
	const { data: document, error: fetchError } = await supabase
		.from('documents')
		.select('id, organization_id, file_path, name')
		.eq('id', params.documentId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (fetchError || !document) {
		return apiError(404, 'NOT_FOUND', 'Document niet gevonden');
	}

	const serviceClient = createServiceClient();

	// Soft delete the document record
	const { error: deleteError } = await serviceClient
		.from('documents')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.documentId);

	if (deleteError) {
		return apiError(500, 'DB_ERROR', deleteError.message);
	}

	// Delete associated chunks
	await serviceClient
		.from('document_chunks')
		.delete()
		.eq('document_id', params.documentId);

	await logAudit(serviceClient, {
		organizationId: document.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'delete',
		entityType: 'document',
		entityId: params.documentId,
		changes: { name: document.name }
	});

	return apiSuccess({ message: 'Document verwijderd' });
};
