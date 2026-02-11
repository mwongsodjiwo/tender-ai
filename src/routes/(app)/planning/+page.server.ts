// Org-level planning page — load cross-project planning overview
// Sprint 5: aggregates timelines, capacity, deadlines across all projects

import type { PageServerLoad } from './$types';
import type { OrganizationPlanningOverview, DeadlineItem } from '$types';
import type { Milestone, PhaseActivity } from '$types';
import {
	buildProjectPlanning,
	buildCapacity,
	buildWarnings,
	buildDeadlineItems
} from '$lib/server/planning/org-planning-helpers';

const DAYS_MS = 1000 * 60 * 60 * 24;

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	const now = new Date();
	const year = now.getFullYear();

	const { data: projects } = await supabase
		.from('projects')
		.select('id, name, status, current_phase, deadline_date, created_at')
		.is('deleted_at', null)
		.not('status', 'eq', 'archived')
		.order('name');

	const activeProjects = projects ?? [];

	if (activeProjects.length === 0) {
		return emptyResult(year);
	}

	const projectIds = activeProjects.map((p) => p.id);

	const [profilesRes, milestonesRes, activitiesRes, membersRes] = await Promise.all([
		supabase.from('project_profiles').select('project_id, timeline_start, timeline_end')
			.in('project_id', projectIds).is('deleted_at', null),
		supabase.from('milestones').select('*')
			.in('project_id', projectIds).is('deleted_at', null).order('target_date'),
		supabase.from('phase_activities').select('*')
			.in('project_id', projectIds).is('deleted_at', null).order('phase'),
		supabase.from('organization_members').select('id').limit(200)
	]);

	const profiles = profilesRes.data ?? [];
	const allMilestones = (milestonesRes.data ?? []) as Milestone[];
	const allActivities = (activitiesRes.data ?? []) as PhaseActivity[];
	const teamSize = membersRes.data?.length ?? 1;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayMs = today.getTime();

	const projectPlannings = activeProjects.map((proj) => {
		const profile = profiles.find((p) => p.project_id === proj.id);
		const ms = allMilestones.filter((m) => m.project_id === proj.id);
		const acts = allActivities.filter((a) => a.project_id === proj.id);
		return buildProjectPlanning(proj, profile ?? undefined, ms, acts, today);
	});

	const capacity = buildCapacity(projectPlannings, allActivities, year, teamSize);
	const deadlineItems = buildDeadlineItems(allMilestones, allActivities, activeProjects, today);
	const warnings = buildWarnings(capacity, projectPlannings);

	const onTrack = projectPlannings.filter((p) => p.is_on_track).length;
	const criticalDl = allMilestones.filter((m) => {
		const days = Math.ceil((new Date(m.target_date).getTime() - todayMs) / DAYS_MS);
		return m.is_critical && m.status !== 'completed' && days >= 0 && days <= 14;
	}).length;

	return {
		overview: {
			projects: projectPlannings,
			capacity,
			warnings,
			summary: { total_active: projectPlannings.length, on_track: onTrack, critical_deadlines: criticalDl }
		} satisfies OrganizationPlanningOverview,
		deadlineItems,
		teamSize,
		year
	};
};

function emptyResult(year: number) {
	const empty: OrganizationPlanningOverview = {
		projects: [], capacity: [], warnings: [],
		summary: { total_active: 0, on_track: 0, critical_deadlines: 0 }
	};
	return { overview: empty, deadlineItems: [] as DeadlineItem[], teamSize: 1, year };
}
