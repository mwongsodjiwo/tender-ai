// GET /api/projects/:id/requirements — List project requirements
// POST /api/projects/:id/requirements — Create a requirement

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createRequirementSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
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
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createRequirementSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { document_type_id, title, description, requirement_type, category, priority, sort_order } = parsed.data;

	// Generate requirement number via database function
	const { data: numberResult, error: numError } = await supabase
		.rpc('next_requirement_number', {
			p_project_id: params.id,
			p_type: requirement_type
		});

	if (numError) {
		return json({ message: numError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: requirement }, { status: 201 });
};
