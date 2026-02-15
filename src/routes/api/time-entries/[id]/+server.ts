// PUT /api/time-entries/:id — Update a time entry
// DELETE /api/time-entries/:id — Delete a time entry

import type { RequestHandler } from './$types';
import { updateTimeEntrySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
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

	const parsed = updateTimeEntrySchema.safeParse(body);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', 'Validatiefout');
	}

	// Verify the entry belongs to the user
	const { data: existing, error: fetchError } = await supabase
		.from('time_entries')
		.select('id, user_id')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (fetchError || !existing) {
		return apiError(404, 'NOT_FOUND', 'Urenregistratie niet gevonden');
	}

	// If project_id is being updated, verify it exists and get organization_id
	const updateData: Record<string, unknown> = { ...parsed.data };

	if (parsed.data.project_id) {
		const { data: project, error: projectError } = await supabase
			.from('projects')
			.select('id, organization_id')
			.eq('id', parsed.data.project_id)
			.is('deleted_at', null)
			.single();

		if (projectError || !project) {
			return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
		}

		updateData.organization_id = project.organization_id;
	}

	const { data, error: updateError } = await supabase
		.from('time_entries')
		.update(updateData)
		.eq('id', params.id)
		.eq('user_id', user.id)
		.select('*, project:projects!time_entries_project_id_fkey(id, name)')
		.single();

	if (updateError) {
		return apiError(500, 'DB_ERROR', 'Fout bij bijwerken urenregistratie');
	}

	await logAudit(supabase, {
		action: 'update',
		entityType: 'time_entry',
		entityId: params.id,
		actorId: user.id,
		changes: parsed.data
	});

	return apiSuccess(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Verify the entry belongs to the user
	const { data: existing, error: fetchError } = await supabase
		.from('time_entries')
		.select('id, user_id, project_id, date, hours')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (fetchError || !existing) {
		return apiError(404, 'NOT_FOUND', 'Urenregistratie niet gevonden');
	}

	const { error: deleteError } = await supabase
		.from('time_entries')
		.delete()
		.eq('id', params.id)
		.eq('user_id', user.id);

	if (deleteError) {
		return apiError(500, 'DB_ERROR', 'Fout bij verwijderen urenregistratie');
	}

	await logAudit(supabase, {
		action: 'delete',
		entityType: 'time_entry',
		entityId: params.id,
		actorId: user.id,
		changes: { project_id: existing.project_id, date: existing.date, hours: existing.hours }
	});

	return apiSuccess({ success: true });
};
