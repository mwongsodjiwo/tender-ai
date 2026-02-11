// GET /api/projects/:id/planning/export/ical — Export planning as iCal

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateICalFeed } from '$server/planning/export-ical';
import { planningExportQuerySchema } from '$server/api/validation';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const queryParams = Object.fromEntries(url.searchParams.entries());
	const parsed = planningExportQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { data: project } = await supabase
		.from('projects')
		.select('id, name')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (!project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const [milestonesResult, activitiesResult] = await Promise.all([
		parsed.data.include_milestones
			? supabase
				.from('milestones')
				.select('*')
				.eq('project_id', params.id)
				.is('deleted_at', null)
				.order('target_date')
			: Promise.resolve({ data: [] }),
		parsed.data.include_activities
			? supabase
				.from('phase_activities')
				.select('*')
				.eq('project_id', params.id)
				.is('deleted_at', null)
				.order('due_date')
			: Promise.resolve({ data: [] })
	]);

	const icalContent = generateICalFeed(
		project.name,
		milestonesResult.data ?? [],
		activitiesResult.data ?? []
	);

	return new Response(icalContent, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${project.name}-planning.ics"`
		}
	});
};
