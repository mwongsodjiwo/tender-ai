// GET /api/projects/:id/uploads/:documentId — Get document metadata
// DELETE /api/projects/:id/uploads/:documentId — Soft delete document

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';
import { createServiceClient } from '$server/db/client';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('documents')
		.select('*')
		.eq('id', params.documentId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !data) {
		return json(
			{ message: 'Document niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	return json({ data });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
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
		return json(
			{ message: 'Document niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	const serviceClient = createServiceClient();

	// Soft delete the document record
	const { error: deleteError } = await serviceClient
		.from('documents')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.documentId);

	if (deleteError) {
		return json({ message: deleteError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: { message: 'Document verwijderd' } });
};
