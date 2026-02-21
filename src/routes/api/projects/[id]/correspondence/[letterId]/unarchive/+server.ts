// POST /api/projects/:id/correspondence/:letterId/unarchive
// Unarchive a correspondence record

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
		supabase, params.letterId, params.id, 'active'
	);
	if (error || !data) {
		return apiError(404, 'NOT_FOUND', 'Brief niet gevonden');
	}

	await logArchiveAudit(supabase, {
		project: project!, user: user!, action: 'unarchive',
		entityType: 'correspondence', entityId: params.letterId,
		newStatus: 'active'
	});

	return apiSuccess({
		message: 'Brief hersteld uit archief', correspondence: data
	});
};
