// GET /api/projects/:id/artifacts — List project artifacts
// POST /api/projects/:id/artifacts — Create an artifact

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createArtifactSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const documentTypeId = url.searchParams.get('document_type_id');

	let query = supabase
		.from('artifacts')
		.select('*')
		.eq('project_id', params.id)
		.order('sort_order', { ascending: true });

	if (documentTypeId) {
		query = query.eq('document_type_id', documentTypeId);
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
	const parsed = createArtifactSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { document_type_id, section_key, title, content, sort_order, metadata } = parsed.data;

	const { data: artifact, error: dbError } = await supabase
		.from('artifacts')
		.insert({
			project_id: params.id,
			document_type_id,
			section_key,
			title,
			content: content ?? '',
			sort_order: sort_order ?? 0,
			metadata: metadata ?? {},
			created_by: user.id,
			status: 'draft'
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
		entityType: 'artifact',
		entityId: artifact.id,
		changes: { section_key, title }
	});

	return json({ data: artifact }, { status: 201 });
};
