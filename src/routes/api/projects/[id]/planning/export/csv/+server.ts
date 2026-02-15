// GET /api/projects/:id/planning/export/csv — Export planning as CSV

import type { RequestHandler } from './$types';
import { generateCsvExport } from '$server/planning/export-csv';
import { planningExportQuerySchema } from '$server/api/validation';
import { apiError } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const queryParams = Object.fromEntries(url.searchParams.entries());
	const parsed = planningExportQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data: project } = await supabase
		.from('projects')
		.select('id, name')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (!project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
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

	const csvContent = generateCsvExport(
		milestonesResult.data ?? [],
		activitiesResult.data ?? []
	);

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${project.name}-planning.csv"`
		}
	});
};
