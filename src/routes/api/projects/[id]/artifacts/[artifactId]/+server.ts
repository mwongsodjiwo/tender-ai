// GET /api/projects/:id/artifacts/:artifactId — Get artifact
// PATCH /api/projects/:id/artifacts/:artifactId — Update artifact (with versioning)

import type { RequestHandler } from './$types';
import { updateArtifactSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('artifacts')
		.select('*')
		.eq('id', params.artifactId)
		.eq('project_id', params.id)
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Artifact niet gevonden');
	}

	return apiSuccess(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateArtifactSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Fetch current artifact to save version before update
	const { data: current, error: fetchError } = await supabase
		.from('artifacts')
		.select('*')
		.eq('id', params.artifactId)
		.eq('project_id', params.id)
		.single();

	if (fetchError || !current) {
		return apiError(404, 'NOT_FOUND', 'Artifact niet gevonden');
	}

	// Save current state as a version before updating (only if content changes)
	const hasContentChange = parsed.data.content !== undefined && parsed.data.content !== current.content;
	if (hasContentChange) {
		await supabase.from('artifact_versions').insert({
			artifact_id: current.id,
			version: current.version,
			title: current.title,
			content: current.content,
			created_by: current.created_by
		});
	}

	const updateData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	// Bump version number if content changed
	if (hasContentChange) {
		updateData['version'] = current.version + 1;
	}

	const { data, error: dbError } = await supabase
		.from('artifacts')
		.update(updateData)
		.eq('id', params.artifactId)
		.eq('project_id', params.id)
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
		action: 'update',
		entityType: 'artifact',
		entityId: params.artifactId,
		changes: updateData
	});

	return apiSuccess(data);
};
