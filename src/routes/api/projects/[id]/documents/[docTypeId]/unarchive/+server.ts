// POST /api/projects/:id/documents/:docTypeId/unarchive
// Unarchive all artifacts for a document type in a project

import type { RequestHandler } from './$types';
import { archiveDocumentParamsSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';
import {
	requireAuth, getProject, updateArtifactsArchiveStatus, logArchiveAudit
} from '$server/api/archive-helpers';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;
	const authErr = requireAuth(user);
	if (authErr) return authErr;

	const parsed = archiveDocumentParamsSchema.safeParse(params);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { project, error: projErr } = await getProject(supabase, params.id);
	if (projErr) return projErr;

	const { data, error } = await updateArtifactsArchiveStatus(
		supabase, params.id, params.docTypeId, 'active'
	);
	if (error) return apiError(500, 'DB_ERROR', error.message);

	await logArchiveAudit(supabase, {
		project: project!, user: user!, action: 'unarchive',
		entityType: 'artifact', entityId: params.docTypeId,
		newStatus: 'active', affectedCount: data?.length ?? 0
	});

	return apiSuccess({
		message: 'Document hersteld uit archief',
		unarchived_count: data?.length ?? 0
	});
};
