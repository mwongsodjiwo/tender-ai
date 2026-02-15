// POST /api/projects/:id/planning/apply — Bulk insert AI-generated planning

import type { RequestHandler } from './$types';
import { applyPlanningSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { PROJECT_PHASES } from '$types';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Validate project exists
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Parse and validate request body
	const body = await request.json();
	const parsed = applyPlanningSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { planning, clear_existing } = parsed.data;

	// Optionally clear existing non-started activities and milestones
	if (clear_existing) {
		await Promise.all([
			supabase
				.from('phase_activities')
				.update({ deleted_at: new Date().toISOString() })
				.eq('project_id', params.id)
				.eq('status', 'not_started')
				.is('deleted_at', null),
			supabase
				.from('milestones')
				.update({ deleted_at: new Date().toISOString() })
				.eq('project_id', params.id)
				.eq('status', 'not_started')
				.is('deleted_at', null),
			supabase
				.from('activity_dependencies')
				.delete()
				.eq('project_id', params.id)
		]);
	}

	// Build title-to-ID mapping for dependencies
	const titleToId = new Map<string, { id: string; type: 'activity' | 'milestone' }>();
	let totalActivities = 0;
	let totalMilestones = 0;
	let totalDependencies = 0;

	// Insert activities and milestones per phase
	for (const phase of planning.phases) {
		// Validate phase name
		const validPhase = PROJECT_PHASES.includes(phase.phase as typeof PROJECT_PHASES[number])
			? phase.phase
			: 'preparing';

		// Insert activities
		for (let i = 0; i < phase.activities.length; i++) {
			const activity = phase.activities[i];

			const { data: inserted, error: insertError } = await supabase
				.from('phase_activities')
				.insert({
					project_id: params.id,
					phase: validPhase,
					activity_type: activity.activity_type || 'general',
					title: activity.title,
					description: activity.description || '',
					planned_start: activity.planned_start || null,
					planned_end: activity.planned_end || null,
					estimated_hours: activity.estimated_hours || null,
					status: 'not_started',
					sort_order: i,
					metadata: { assigned_role: activity.assigned_role, ai_generated: true }
				})
				.select('id')
				.single();

			if (insertError || !inserted) {
				return apiError(500, 'DB_ERROR', `Fout bij invoegen activiteit "${activity.title}": ${insertError?.message}`);
			}

			titleToId.set(activity.title, { id: inserted.id, type: 'activity' });
			totalActivities++;
		}

		// Insert milestones
		for (let i = 0; i < phase.milestones.length; i++) {
			const milestone = phase.milestones[i];

			const { data: inserted, error: insertError } = await supabase
				.from('milestones')
				.insert({
					project_id: params.id,
					milestone_type: milestone.milestone_type || 'custom',
					title: milestone.title,
					target_date: milestone.target_date,
					phase: validPhase,
					is_critical: milestone.is_critical ?? false,
					status: 'not_started',
					sort_order: i,
					created_by: user.id,
					metadata: { ai_generated: true }
				})
				.select('id')
				.single();

			if (insertError || !inserted) {
				return apiError(500, 'DB_ERROR', `Fout bij invoegen milestone "${milestone.title}": ${insertError?.message}`);
			}

			titleToId.set(milestone.title, { id: inserted.id, type: 'milestone' });
			totalMilestones++;
		}
	}

	// Insert dependencies using title-to-ID mapping
	for (const dep of planning.dependencies) {
		const source = titleToId.get(dep.from_title);
		const target = titleToId.get(dep.to_title);

		if (!source || !target) {
			// Skip dependencies with unresolved titles
			continue;
		}

		const { error: depError } = await supabase
			.from('activity_dependencies')
			.insert({
				project_id: params.id,
				source_type: source.type,
				source_id: source.id,
				target_type: target.type,
				target_id: target.id,
				dependency_type: dep.type || 'finish_to_start',
				lag_days: dep.lag_days || 0
			});

		if (!depError) {
			totalDependencies++;
		}
	}

	// Update project profile with planning metadata
	await supabase
		.from('project_profiles')
		.update({
			planning_generated_at: new Date().toISOString(),
			planning_approved: false,
			planning_metadata: {
				generated_by: user.id,
				total_activities: totalActivities,
				total_milestones: totalMilestones,
				total_dependencies: totalDependencies,
				generated_at: new Date().toISOString()
			}
		})
		.eq('project_id', params.id)
		.is('deleted_at', null);

	// Audit log
	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'planning',
		changes: {
			action: 'apply_ai_planning',
			total_activities: totalActivities,
			total_milestones: totalMilestones,
			total_dependencies: totalDependencies,
			clear_existing
		}
	});

	return apiSuccess({
		total_activities: totalActivities,
		total_milestones: totalMilestones,
		total_dependencies: totalDependencies
	}, 201);
};
