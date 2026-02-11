// Project planning page — load milestones, activities with dates, dependencies
// Enhanced for Sprint 3 Gantt chart (also loads dependencies for timeline view)

import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { PhaseActivity, Milestone, DeadlineItem, ActivityDependency } from '$types';

const DAYS_MS = 1000 * 60 * 60 * 24;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const [activitiesResult, milestonesResult, profileResult, projectResult, dependenciesResult] = await Promise.all([
		// Load phase activities (with due_date or planning dates)
		supabase
			.from('phase_activities')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('phase')
			.order('sort_order'),

		// Load milestones
		supabase
			.from('milestones')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('target_date'),

		// Load project profile for timeline dates
		supabase
			.from('project_profiles')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.maybeSingle(),

		// Load project for name
		supabase
			.from('projects')
			.select('id, name')
			.eq('id', params.id)
			.single(),

		// Load activity dependencies for Gantt chart
		supabase
			.from('activity_dependencies')
			.select('*')
			.eq('project_id', params.id)
	]);

	const activities: PhaseActivity[] = (activitiesResult.data ?? []) as PhaseActivity[];
	const milestones: Milestone[] = (milestonesResult.data ?? []) as Milestone[];
	const dependencies: ActivityDependency[] = (dependenciesResult.data ?? []) as ActivityDependency[];
	const projectProfile = profileResult.data ?? null;
	const project = projectResult.data;

	if (!project) {
		throw error(404, 'Project niet gevonden');
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayMs = today.getTime();

	// Build combined deadline items from both milestones and activities
	const milestoneDeadlines: DeadlineItem[] = milestones
		.filter((m) => m.status !== 'completed')
		.map((m) => {
			const targetMs = new Date(m.target_date).getTime();
			const daysRemaining = Math.ceil((targetMs - todayMs) / DAYS_MS);
			return {
				id: m.id,
				type: 'milestone' as const,
				title: m.title,
				date: m.target_date,
				project_id: m.project_id,
				project_name: project.name,
				phase: m.phase ?? 'preparing',
				status: m.status,
				is_critical: m.is_critical,
				assigned_to: null,
				assigned_to_name: null,
				days_remaining: daysRemaining,
				is_overdue: daysRemaining < 0
			};
		});

	const activityDeadlines: DeadlineItem[] = activities
		.filter((a) => a.due_date && a.status !== 'completed' && a.status !== 'skipped')
		.map((a) => {
			const dueMs = new Date(a.due_date!).getTime();
			const daysRemaining = Math.ceil((dueMs - todayMs) / DAYS_MS);
			return {
				id: a.id,
				type: 'activity' as const,
				title: a.title,
				date: a.due_date!,
				project_id: a.project_id,
				project_name: project.name,
				phase: a.phase,
				status: a.status,
				is_critical: false,
				assigned_to: a.assigned_to ?? null,
				assigned_to_name: null,
				days_remaining: daysRemaining,
				is_overdue: daysRemaining < 0
			};
		});

	const deadlineItems = [...milestoneDeadlines, ...activityDeadlines].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	);

	// Metrics
	const totalActivities = activities.length;
	const completedActivities = activities.filter((a) => a.status === 'completed').length;
	const totalMilestones = milestones.length;
	const completedMilestones = milestones.filter((m) => m.status === 'completed').length;

	return {
		activities,
		milestones,
		dependencies,
		deadlineItems,
		projectProfile,
		planningMetrics: {
			totalActivities,
			completedActivities,
			totalMilestones,
			completedMilestones,
			progressPercentage:
				totalActivities > 0
					? Math.round((completedActivities / totalActivities) * 100)
					: 0,
			overdueCount: deadlineItems.filter((d) => d.is_overdue).length,
			thisWeekCount: deadlineItems.filter(
				(d) => d.days_remaining >= 0 && d.days_remaining <= 7
			).length,
			criticalCount: deadlineItems.filter((d) => d.is_critical).length
		}
	};
};

export const actions = {
	// Create milestone
	createMilestone: async ({ request, params, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			throw error(401, 'Niet ingelogd');
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const milestoneType = formData.get('milestone_type') as string;
		const targetDate = formData.get('target_date') as string;
		const phase = formData.get('phase') as string | null;
		const isCritical = formData.get('is_critical') === 'true';
		const description = (formData.get('description') as string) ?? '';

		if (!title || !milestoneType || !targetDate) {
			throw error(400, 'Titel, type en datum zijn verplicht');
		}

		const { error: insertError } = await supabase.from('milestones').insert({
			project_id: params.id,
			title,
			milestone_type: milestoneType,
			target_date: targetDate,
			phase: phase || null,
			is_critical: isCritical,
			description,
			status: 'not_started',
			created_by: session.user.id
		});

		if (insertError) {
			throw error(500, `Fout bij aanmaken milestone: ${insertError.message}`);
		}

		return { success: true };
	},

	// Delete milestone (soft delete)
	deleteMilestone: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			throw error(401, 'Niet ingelogd');
		}

		const formData = await request.formData();
		const milestoneId = formData.get('milestone_id') as string;

		if (!milestoneId) {
			throw error(400, 'Milestone ID is verplicht');
		}

		const { error: updateError } = await supabase
			.from('milestones')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', milestoneId);

		if (updateError) {
			throw error(500, `Fout bij verwijderen milestone: ${updateError.message}`);
		}

		return { success: true };
	},

	// Update milestone status
	updateMilestoneStatus: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			throw error(401, 'Niet ingelogd');
		}

		const formData = await request.formData();
		const milestoneId = formData.get('milestone_id') as string;
		const status = formData.get('status') as string;

		if (!milestoneId || !status) {
			throw error(400, 'Milestone ID en status zijn verplicht');
		}

		const updateData: Record<string, unknown> = { status };
		if (status === 'completed') {
			updateData.actual_date = new Date().toISOString().split('T')[0];
		}

		const { error: updateError } = await supabase
			.from('milestones')
			.update(updateData)
			.eq('id', milestoneId);

		if (updateError) {
			throw error(500, `Fout bij bijwerken milestone: ${updateError.message}`);
		}

		return { success: true };
	}
} satisfies Actions;
