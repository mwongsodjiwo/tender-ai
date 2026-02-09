// GET /api/projects/:id/correspondence — List correspondence (filter ?phase=, ?status=)
// POST /api/projects/:id/correspondence — Create correspondence

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCorrespondenceSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	let query = supabase
		.from('correspondence')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const phase = url.searchParams.get('phase');
	if (phase) {
		query = query.eq('phase', phase);
	}

	const status = url.searchParams.get('status');
	if (status) {
		query = query.eq('status', status);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: data ?? [] });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const body = await request.json();
	const parsed = createCorrespondenceSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { data: letter, error: dbError } = await supabase
		.from('correspondence')
		.insert({ project_id: params.id, created_by: user.id, ...parsed.data })
		.select()
		.single();

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'correspondence',
		entityId: letter.id,
		changes: parsed.data
	});

	return json({ data: letter }, { status: 201 });
};
