// POST /api/projects/:id/profile/confirm — Confirm project profile

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { confirmProjectProfileSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id, profile_confirmed')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	if (project.profile_confirmed) {
		return json({ message: 'Profiel is al bevestigd', code: 'ALREADY_CONFIRMED', status: 409 }, { status: 409 });
	}

	// Verify that profile exists
	const { data: profile, error: profileError } = await supabase
		.from('project_profiles')
		.select('id')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (profileError || !profile) {
		return json({ message: 'Projectprofiel niet gevonden. Vul eerst het profiel in.', code: 'PROFILE_NOT_FOUND', status: 400 }, { status: 400 });
	}

	const body = await request.json();
	const parsed = confirmProjectProfileSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: updateError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({
		data: {
			profile_confirmed: true,
			profile_confirmed_at: confirmedAt
		}
	});
};
