// GET /api/projects/:id/artifacts — List project artifacts
// POST /api/projects/:id/artifacts — Create an artifact

import type { RequestHandler } from './$types';
import { createArtifactSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
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
	const parsed = createArtifactSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
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
		entityType: 'artifact',
		entityId: artifact.id,
		changes: { section_key, title }
	});

	return apiSuccess(artifact, 201);
};
