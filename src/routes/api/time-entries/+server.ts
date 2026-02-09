// GET /api/time-entries — List time entries (filter by week or date range)
// POST /api/time-entries — Create a new time entry

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTimeEntrySchema, timeEntryQuerySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

const ISO_WEEK_REGEX = /^(\d{4})-W(\d{2})$/;
const DAYS_IN_WEEK = 7;

/** Convert ISO week string (e.g. "2026-W07") to start (Monday) and end (Sunday) dates */
function weekToDateRange(weekStr: string): { from: string; to: string } {
	const match = weekStr.match(ISO_WEEK_REGEX);
	if (!match) {
		throw new Error('Invalid week format');
	}

	const year = parseInt(match[1], 10);
	const week = parseInt(match[2], 10);

	// ISO week date calculation: Jan 4 is always in week 1
	const jan4 = new Date(year, 0, 4);
	const dayOfWeek = jan4.getDay() || DAYS_IN_WEEK; // Sunday = 7
	const monday = new Date(jan4);
	monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * DAYS_IN_WEEK);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);

	const formatDate = (d: Date): string =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	return { from: formatDate(monday), to: formatDate(sunday) };
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const rawParams = {
		week: url.searchParams.get('week') ?? undefined,
		from: url.searchParams.get('from') ?? undefined,
		to: url.searchParams.get('to') ?? undefined,
		project_id: url.searchParams.get('project_id') ?? undefined
	};

	const parsed = timeEntryQuerySchema.safeParse(rawParams);
	if (!parsed.success) {
		return json({
			message: 'Validatiefout',
			code: 'VALIDATION_ERROR',
			status: 400,
			errors: parsed.error.flatten().fieldErrors
		}, { status: 400 });
	}

	const { week, project_id } = parsed.data;
	let { from, to } = parsed.data;

	// Convert week to date range if provided
	if (week) {
		const range = weekToDateRange(week);
		from = range.from;
		to = range.to;
	}

	let query = supabase
		.from('time_entries')
		.select('*, project:projects!time_entries_project_id_fkey(id, name)')
		.eq('user_id', user.id)
		.order('date', { ascending: true })
		.order('created_at', { ascending: true });

	if (from) {
		query = query.gte('date', from);
	}

	if (to) {
		query = query.lte('date', to);
	}

	if (project_id) {
		query = query.eq('project_id', project_id);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return json({ message: 'Fout bij ophalen urenregistraties', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: data ?? [] });
};

export const POST: RequestHandler = async ({ request, locals }) => {
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

	const parsed = createTimeEntrySchema.safeParse(body);
	if (!parsed.success) {
		return json({
			message: 'Validatiefout',
			code: 'VALIDATION_ERROR',
			status: 400,
			errors: parsed.error.flatten().fieldErrors
		}, { status: 400 });
	}

	const { project_id, date, hours, activity_type, notes } = parsed.data;

	// Verify project exists and get organization_id
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', project_id)
		.is('deleted_at', null)
		.single();

	if (projectError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const { data, error: insertError } = await supabase
		.from('time_entries')
		.insert({
			user_id: user.id,
			organization_id: project.organization_id,
			project_id,
			date,
			hours,
			activity_type,
			notes
		})
		.select('*, project:projects!time_entries_project_id_fkey(id, name)')
		.single();

	if (insertError) {
		return json({ message: 'Fout bij aanmaken urenregistratie', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		action: 'create',
		entityType: 'time_entry',
		entityId: data.id,
		actorId: user.id,
		changes: { project_id, date, hours, activity_type }
	});

	return json({ data }, { status: 201 });
};
