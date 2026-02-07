// GET /api/projects/:id/reviewers — List all section reviewers for a project
// POST /api/projects/:id/reviewers — Invite a kennishouder to review a section

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inviteReviewerSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Get all artifacts for this project, then their reviewers
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('id')
		.eq('project_id', params.id);

	if (!artifacts || artifacts.length === 0) {
		return json({ data: [] });
	}

	const artifactIds = artifacts.map((a) => a.id);

	const { data: reviewers, error: dbError } = await supabase
		.from('section_reviewers')
		.select('*, artifact:artifacts(id, title, section_key)')
		.in('artifact_id', artifactIds)
		.order('created_at', { ascending: false });

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: reviewers ?? [] });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = inviteReviewerSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json(
			{ message: 'Sectie niet gevonden in dit project', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
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
		return json({ message: createError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: reviewer }, { status: 201 });
};
