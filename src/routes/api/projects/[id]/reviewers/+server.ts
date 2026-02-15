// GET /api/projects/:id/reviewers — List all section reviewers for a project
// POST /api/projects/:id/reviewers — Invite a kennishouder to review a section

import type { RequestHandler } from './$types';
import { inviteReviewerSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Get all artifacts for this project, then their reviewers
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('id')
		.eq('project_id', params.id);

	if (!artifacts || artifacts.length === 0) {
		return apiSuccess([]);
	}

	const artifactIds = artifacts.map((a) => a.id);

	const { data: reviewers, error: dbError } = await supabase
		.from('section_reviewers')
		.select('*, artifact:artifacts(id, title, section_key)')
		.in('artifact_id', artifactIds)
		.order('created_at', { ascending: false });

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(reviewers ?? []);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = inviteReviewerSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { artifact_id, email, name } = parsed.data;

	// Verify artifact belongs to this project
	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('id, title, project_id')
		.eq('id', artifact_id)
		.eq('project_id', params.id)
		.single();

	if (artError || !artifact) {
		return apiError(404, 'NOT_FOUND', 'Sectie niet gevonden in dit project');
	}

	// Create reviewer with auto-generated token
	const { data: reviewer, error: createError } = await supabase
		.from('section_reviewers')
		.insert({
			artifact_id,
			email,
			name
		})
		.select()
		.single();

	if (createError) {
		return apiError(500, 'DB_ERROR', createError.message);
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
		action: 'invite',
		entityType: 'section_reviewer',
		entityId: reviewer.id,
		changes: { email, name, artifact_id, artifact_title: artifact.title }
	});

	return apiSuccess(reviewer, 201);
};
