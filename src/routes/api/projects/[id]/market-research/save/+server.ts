// POST /api/projects/:id/market-research/save — Save market research content to phase_activities metadata

import type { RequestHandler } from './$types';
import { saveMarketResearchSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { MARKET_RESEARCH_ACTIVITY_TYPE_LABELS } from '$types';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const body = await request.json();
	const parsed = saveMarketResearchSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { activity_type, content, metadata } = parsed.data;
	const title = MARKET_RESEARCH_ACTIVITY_TYPE_LABELS[activity_type as keyof typeof MARKET_RESEARCH_ACTIVITY_TYPE_LABELS] ?? activity_type;

	// Upsert phase_activity for this activity type
	const { data: existing } = await supabase
		.from('phase_activities')
		.select('id, metadata')
		.eq('project_id', params.id)
		.eq('phase', 'exploring')
		.eq('activity_type', activity_type)
		.is('deleted_at', null)
		.maybeSingle();

	let activity;
	if (existing) {
		// Update existing activity
		const { data: updated, error: updateError } = await supabase
			.from('phase_activities')
			.update({
				status: 'in_progress',
				metadata: { ...(existing.metadata as Record<string, unknown> ?? {}), content, ...metadata },
				updated_at: new Date().toISOString()
			})
			.eq('id', existing.id)
			.select()
			.single();

		if (updateError) {
			return apiError(500, 'DB_ERROR', updateError.message);
		}
		activity = updated;
	} else {
		// Create new activity
		const { data: created, error: createError } = await supabase
			.from('phase_activities')
			.insert({
				project_id: params.id,
				phase: 'exploring',
				activity_type,
				title,
				description: '',
				status: 'in_progress',
				sort_order: 0,
				metadata: { content, ...metadata }
			})
			.select()
			.single();

		if (createError) {
			return apiError(500, 'DB_ERROR', createError.message);
		}
		activity = created;
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: existing ? 'update' : 'create',
		entityType: 'market_research_content',
		entityId: activity.id,
		changes: { activity_type, content_length: content.length }
	});

	return apiSuccess(activity, existing ? 200 : 201);
};
