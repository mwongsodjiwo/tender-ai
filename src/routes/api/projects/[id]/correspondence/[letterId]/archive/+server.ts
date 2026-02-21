// POST /api/projects/:id/correspondence/:letterId/archive
// Archive a correspondence record

import type { RequestHandler } from './$types';
import { archiveCorrespondenceParamsSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';
import {
	requireAuth, getProject, updateCorrespondenceArchiveStatus, logArchiveAudit
} from '$server/api/archive-helpers';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;
	const authErr = requireAuth(user);
	if (authErr) return authErr;

	const parsed = archiveCorrespondenceParamsSchema.safeParse(params);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { project, error: projErr } = await getProject(supabase, params.id);
	if (projErr) return projErr;

	const { data, error } = await updateCorrespondenceArchiveStatus(
		supabase, params.letterId, params.id, 'archived'
	);
	if (error || !data) {
		return apiError(404, 'NOT_FOUND', 'Brief niet gevonden');
	}

	await logArchiveAudit(supabase, {
		project: project!, user: user!, action: 'archive',
		entityType: 'correspondence', entityId: params.letterId,
		newStatus: 'archived'
	});

	return apiSuccess({
		message: 'Brief gearchiveerd', correspondence: data
	});
};
