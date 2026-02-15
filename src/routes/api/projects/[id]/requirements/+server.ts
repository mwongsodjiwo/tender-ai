// GET /api/projects/:id/requirements — List project requirements
// POST /api/projects/:id/requirements — Create a requirement

import type { RequestHandler } from './$types';
import { createRequirementSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const typeFilter = url.searchParams.get('type');
	const categoryFilter = url.searchParams.get('category');
	const search = url.searchParams.get('q');

	let query = supabase
		.from('requirements')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('category')
		.order('sort_order', { ascending: true });

	if (typeFilter) {
		query = query.eq('requirement_type', typeFilter);
	}

	if (categoryFilter) {
		query = query.eq('category', categoryFilter);
	}

	if (search) {
		query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createRequirementSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { document_type_id, title, description, requirement_type, category, priority, sort_order } = parsed.data;

	// Generate requirement number via database function
	const { data: numberResult, error: numError } = await supabase
		.rpc('next_requirement_number', {
			p_project_id: params.id,
			p_type: requirement_type
		});

	if (numError) {
		return apiError(500, 'DB_ERROR', numError.message);
	}

	// Determine sort_order if not provided
	let finalSortOrder = sort_order;
	if (finalSortOrder === undefined) {
		const { data: maxSort } = await supabase
			.from('requirements')
			.select('sort_order')
			.eq('project_id', params.id)
			.eq('category', category)
			.is('deleted_at', null)
			.order('sort_order', { ascending: false })
			.limit(1)
			.single();

		finalSortOrder = (maxSort?.sort_order ?? -1) + 1;
	}

	const { data: requirement, error: dbError } = await supabase
		.from('requirements')
		.insert({
			project_id: params.id,
			document_type_id,
			requirement_number: numberResult,
			title,
			description: description ?? '',
			requirement_type,
			category,
			priority: priority ?? 3,
			sort_order: finalSortOrder,
			created_by: user.id
		})
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', params.id)
		.single();

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'requirement',
		entityId: requirement.id,
		changes: { title, requirement_type, category }
	});

	return apiSuccess(requirement, 201);
};
