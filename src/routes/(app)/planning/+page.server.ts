// Org-level planning page — load cross-project planning overview
// Sprint 5: aggregates timelines, capacity, deadlines across all projects
// Sprint 7: adds team workload data

import type { PageServerLoad } from './$types';
import type { OrganizationPlanningOverview, DeadlineItem, TeamWorkloadResponse } from '$types';
import type { Milestone, PhaseActivity, TimeEntry, Profile } from '$types';
import {
	buildProjectPlanning,
	buildCapacity,
	buildWarnings,
	buildDeadlineItems
} from '$lib/server/planning/org-planning-helpers';
import {
	buildMemberWorkload,
	buildMemberInfoList,
	detectOverloads
} from '$lib/server/planning/workload-helpers';

const DAYS_MS = 1000 * 60 * 60 * 24;

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	const now = new Date();
	const year = now.getFullYear();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
		.toISOString().split('T')[0];
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
		.toISOString().split('T')[0];

	const { data: projects } = await supabase
		.from('projects')
		.select('id, name, status, current_phase, deadline_date, created_at')
		.is('deleted_at', null)
		.not('status', 'eq', 'archived')
		.order('name');

	const activeProjects = projects ?? [];

	if (activeProjects.length === 0) {
		return emptyResult(year, monthStart, monthEnd);
	}

	const projectIds = activeProjects.map((p) => p.id);

	const [profilesRes, milestonesRes, activitiesRes, membersRes] = await Promise.all([
		supabase.from('project_profiles').select('project_id, timeline_start, timeline_end')
			.in('project_id', projectIds).is('deleted_at', null),
		supabase.from('milestones').select('*')
			.in('project_id', projectIds).is('deleted_at', null).order('target_date'),
		supabase.from('phase_activities').select('*')
			.in('project_id', projectIds).is('deleted_at', null).order('phase'),
		supabase.from('organization_members')
			.select('profile_id, profiles!inner(id, first_name, last_name, avatar_url)')
			.limit(200)
	]);

	const profiles = profilesRes.data ?? [];
	const allMilestones = (milestonesRes.data ?? []) as Milestone[];
	const allActivities = (activitiesRes.data ?? []) as PhaseActivity[];
	const orgMembers = membersRes.data ?? [];
	const teamSize = orgMembers.length || 1;

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

	// Sprint 7: Build workload data
	const workload = await buildWorkloadData(
		supabase, orgMembers, allActivities, activeProjects, monthStart, monthEnd
	);

	return {
		overview: {
			projects: projectPlannings,
			capacity,
			warnings,
			summary: { total_active: projectPlannings.length, on_track: onTrack, critical_deadlines: criticalDl }
		} satisfies OrganizationPlanningOverview,
		deadlineItems,
		teamSize,
		year,
		workload,
		workloadFrom: monthStart,
		workloadTo: monthEnd
	};
};

async function buildWorkloadData(
	supabase: App.Locals['supabase'],
	orgMembers: { profile_id: string; profiles: unknown }[],
	allActivities: PhaseActivity[],
	activeProjects: { id: string; name: string }[],
	from: string,
	to: string
): Promise<TeamWorkloadResponse> {
	if (orgMembers.length === 0) {
		return { members: [], warnings: [] };
	}

	const profileIds = orgMembers.map((m) => m.profile_id);
	const projectNames = new Map(activeProjects.map((p) => [p.id, p.name]));

	const [timeEntriesRes, rolesRes] = await Promise.all([
		supabase.from('time_entries').select('*')
			.in('user_id', profileIds).gte('date', from).lte('date', to),
		supabase.from('project_member_roles')
			.select('project_members!inner(profile_id), role')
			.in('project_members.profile_id', profileIds)
	]);

	const allTimeEntries = (timeEntriesRes.data ?? []) as TimeEntry[];
	const roleMappings = (rolesRes.data ?? []).map((r) => {
		const pm = r.project_members as unknown as { profile_id: string };
		return { profile_id: pm.profile_id, role: r.role };
	});

	const memberProfiles = orgMembers.map((m) => m.profiles as unknown as Profile)
		.filter((p): p is Profile => p !== null);
	const memberInfoList = buildMemberInfoList(orgMembers, memberProfiles, roleMappings);

	const memberWorkloads = memberInfoList.map((member) =>
		buildMemberWorkload(member, allActivities, allTimeEntries, projectNames)
	);

	memberWorkloads.sort((a, b) => {
		const aOver = a.summary.overloaded_weeks.length > 0 ? 1 : 0;
		const bOver = b.summary.overloaded_weeks.length > 0 ? 1 : 0;
		if (aOver !== bOver) return bOver - aOver;
		return b.summary.total_assigned_hours - a.summary.total_assigned_hours;
	});

	return { members: memberWorkloads, warnings: detectOverloads(memberWorkloads) };
}

function emptyResult(year: number, from: string, to: string) {
	const empty: OrganizationPlanningOverview = {
		projects: [], capacity: [], warnings: [],
		summary: { total_active: 0, on_track: 0, critical_deadlines: 0 }
	};
	const emptyWorkload: TeamWorkloadResponse = { members: [], warnings: [] };
	return {
		overview: empty,
		deadlineItems: [] as DeadlineItem[],
		teamSize: 1,
		year,
		workload: emptyWorkload,
		workloadFrom: from,
		workloadTo: to
	};
}
