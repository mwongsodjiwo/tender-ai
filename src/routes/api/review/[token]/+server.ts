// GET /api/review/:token — Validate magic link and return review data
// PATCH /api/review/:token — Submit review (approve/reject with feedback)

import type { RequestHandler } from './$types';
import { updateReviewSchema } from '$server/api/validation';
import { createServiceClient } from '$server/db/client';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params }) => {
	// Use service client — no auth required for magic link access
	const supabase = createServiceClient();

	const { data: reviewer, error: reviewerError } = await supabase
		.from('section_reviewers')
		.select('*')
		.eq('token', params.token)
		.single();

	if (reviewerError || !reviewer) {
		return apiError(404, 'NOT_FOUND', 'Ongeldige of verlopen reviewlink');
	}

	// Check expiration
	if (new Date(reviewer.expires_at) < new Date()) {
		return apiError(410, 'NOT_FOUND', 'Deze reviewlink is verlopen');
	}

	// Get artifact with project info
	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('*, project:projects(id, name)')
		.eq('id', reviewer.artifact_id)
		.single();

	if (artError || !artifact) {
		return apiError(404, 'NOT_FOUND', 'Sectie niet gevonden');
	}

	return apiSuccess({
		reviewer: {
			id: reviewer.id,
			artifact_id: reviewer.artifact_id,
			email: reviewer.email,
			name: reviewer.name,
			review_status: reviewer.review_status,
			feedback: reviewer.feedback,
			reviewed_at: reviewer.reviewed_at,
			expires_at: reviewer.expires_at,
			created_at: reviewer.created_at
		},
		artifact: {
			id: artifact.id,
			title: artifact.title,
			content: artifact.content,
			section_key: artifact.section_key,
			status: artifact.status,
			version: artifact.version
		},
		project: {
			id: (artifact as Record<string, unknown>).project
				? ((artifact as Record<string, unknown>).project as { id: string; name: string }).id
				: artifact.project_id,
			name: (artifact as Record<string, unknown>).project
				? ((artifact as Record<string, unknown>).project as { id: string; name: string }).name
				: ''
		}
	});
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const supabase = createServiceClient();

	// Validate token first
	const { data: reviewer, error: reviewerError } = await supabase
		.from('section_reviewers')
		.select('*, artifact:artifacts(project_id, title)')
		.eq('token', params.token)
		.single();

	if (reviewerError || !reviewer) {
		return apiError(404, 'NOT_FOUND', 'Ongeldige of verlopen reviewlink');
	}

	if (new Date(reviewer.expires_at) < new Date()) {
		return apiError(410, 'NOT_FOUND', 'Deze reviewlink is verlopen');
	}

	const body = await request.json();
	const parsed = updateReviewSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { review_status, feedback } = parsed.data;

	const { data: updated, error: updateError } = await supabase
		.from('section_reviewers')
		.update({
			review_status,
			feedback: feedback ?? null,
			reviewed_at: new Date().toISOString()
		})
		.eq('id', reviewer.id)
		.select()
		.single();

	if (updateError) {
		return apiError(500, 'DB_ERROR', updateError.message);
	}

	const artifactData = (reviewer as Record<string, unknown>).artifact as { project_id: string; title: string } | null;

	// Get project org for audit
	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', artifactData?.project_id ?? '')
		.single();

	const auditAction = review_status === 'approved' ? 'approve' : 'reject';

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: artifactData?.project_id,
		actorEmail: reviewer.email,
		action: auditAction,
		entityType: 'section_reviewer',
		entityId: reviewer.id,
		changes: {
			review_status,
			feedback: feedback ?? null,
			artifact_title: artifactData?.title
		}
	});

	return apiSuccess(updated);
};
