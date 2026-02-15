// POST /api/projects/:id/profile/confirm — Confirm project profile

import type { RequestHandler } from './$types';
import { confirmProjectProfileSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id, profile_confirmed')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	if (project.profile_confirmed) {
		return apiError(409, 'DUPLICATE', 'Profiel is al bevestigd');
	}

	// Verify that profile exists
	const { data: profile, error: profileError } = await supabase
		.from('project_profiles')
		.select('id')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (profileError || !profile) {
		return apiError(400, 'VALIDATION_ERROR', 'Projectprofiel niet gevonden. Vul eerst het profiel in.');
	}

	const body = await request.json();
	const parsed = confirmProjectProfileSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const confirmedAt = new Date().toISOString();

	const { error: updateError } = await supabase
		.from('projects')
		.update({
			profile_confirmed: true,
			profile_confirmed_at: confirmedAt
		})
		.eq('id', params.id);

	if (updateError) {
		return apiError(500, 'DB_ERROR', updateError.message);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'approve',
		entityType: 'project_profile',
		entityId: profile.id,
		changes: { profile_confirmed: true, profile_confirmed_at: confirmedAt }
	});

	return apiSuccess({
		profile_confirmed: true,
		profile_confirmed_at: confirmedAt
	});
};
