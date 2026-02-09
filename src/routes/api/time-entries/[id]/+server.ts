// PUT /api/time-entries/:id — Update a time entry
// DELETE /api/time-entries/:id — Delete a time entry

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateTimeEntrySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
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

	const parsed = updateTimeEntrySchema.safeParse(body);
	if (!parsed.success) {
		return json({
			message: 'Validatiefout',
			code: 'VALIDATION_ERROR',
			status: 400,
			errors: parsed.error.flatten().fieldErrors
		}, { status: 400 });
	}

	// Verify the entry belongs to the user
	const { data: existing, error: fetchError } = await supabase
		.from('time_entries')
		.select('id, user_id')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (fetchError || !existing) {
		return json({ message: 'Urenregistratie niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
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
			return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
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
		return json({ message: 'Fout bij bijwerken urenregistratie', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		action: 'update',
		entityType: 'time_entry',
		entityId: params.id,
		actorId: user.id,
		changes: parsed.data
	});

	return json({ data });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Verify the entry belongs to the user
	const { data: existing, error: fetchError } = await supabase
		.from('time_entries')
		.select('id, user_id, project_id, date, hours')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (fetchError || !existing) {
		return json({ message: 'Urenregistratie niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const { error: deleteError } = await supabase
		.from('time_entries')
		.delete()
		.eq('id', params.id)
		.eq('user_id', user.id);

	if (deleteError) {
		return json({ message: 'Fout bij verwijderen urenregistratie', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		action: 'delete',
		entityType: 'time_entry',
		entityId: params.id,
		actorId: user.id,
		changes: { project_id: existing.project_id, date: existing.date, hours: existing.hours }
	});

	return json({ success: true });
};
