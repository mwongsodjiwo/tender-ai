// Workload aggregation helpers — Planning Sprint 7
// Builds per-member workload view from activities and time entries

import type {
	MemberWorkload,
	MemberTimeLogged,
	MemberWorkloadSummary,
	WorkloadAssignment,
	OverloadWarning
} from '$types';
import type { PhaseActivity, TimeEntry, Profile, ProjectMemberRole } from '$types';

const MAX_WEEKLY_HOURS = 40;
const DAYS_MS = 1000 * 60 * 60 * 24;

interface MemberInfo {
	profile_id: string;
	first_name: string;
	last_name: string;
	avatar_url: string | null;
	roles: string[];
}

interface ProjectNameMap {
	get(id: string): string | undefined;
}

export function buildMemberAssignments(
	activities: PhaseActivity[],
	profileId: string,
	projectNames: ProjectNameMap
): WorkloadAssignment[] {
	return activities
		.filter((a) => a.assigned_to === profileId && a.status !== 'completed' && a.status !== 'skipped')
		.map((a) => ({
			project_id: a.project_id,
			project_name: projectNames.get(a.project_id) ?? '',
			activity_id: a.id,
			activity_title: a.title,
			phase: a.phase,
			planned_start: a.planned_start,
			planned_end: a.planned_end,
			estimated_hours: a.estimated_hours,
			status: a.status
		}));
}

export function buildTimeLogged(
	entries: TimeEntry[],
	profileId: string,
	projectNames: ProjectNameMap
): MemberTimeLogged[] {
	const userEntries = entries.filter((e) => e.user_id === profileId);
	const weekMap = new Map<string, { hours: number; byProject: Map<string, number> }>();

	for (const entry of userEntries) {
		const week = getISOWeek(entry.date);
		let bucket = weekMap.get(week);
		if (!bucket) {
			bucket = { hours: 0, byProject: new Map() };
			weekMap.set(week, bucket);
		}
		bucket.hours += entry.hours;
		const prev = bucket.byProject.get(entry.project_id) ?? 0;
		bucket.byProject.set(entry.project_id, prev + entry.hours);
	}

	return Array.from(weekMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([week, bucket]) => {
			const byProject: Record<string, number> = {};
			for (const [pid, hrs] of bucket.byProject) {
				byProject[projectNames.get(pid) ?? pid] = hrs;
			}
			return { week, hours: bucket.hours, by_project: byProject };
		});
}

export function buildWorkloadSummary(
	assignments: WorkloadAssignment[],
	timeLogged: MemberTimeLogged[]
): MemberWorkloadSummary {
	const totalAssigned = assignments.reduce((sum, a) => sum + (a.estimated_hours ?? 0), 0);
	const totalLogged = timeLogged.reduce((sum, w) => sum + w.hours, 0);
	const overloadedWeeks = timeLogged
		.filter((w) => w.hours > MAX_WEEKLY_HOURS)
		.map((w) => w.week);
	const totalAvailable = timeLogged.length * MAX_WEEKLY_HOURS;
	const utilization = totalAvailable > 0
		? Math.round((totalLogged / totalAvailable) * 100)
		: 0;

	return {
		total_assigned_hours: Math.round(totalAssigned),
		total_logged_hours: Math.round(totalLogged * 10) / 10,
		utilization_percentage: utilization,
		overloaded_weeks: overloadedWeeks
	};
}

export function buildMemberWorkload(
	member: MemberInfo,
	activities: PhaseActivity[],
	entries: TimeEntry[],
	projectNames: ProjectNameMap
): MemberWorkload {
	const assignments = buildMemberAssignments(activities, member.profile_id, projectNames);
	const timeLogged = buildTimeLogged(entries, member.profile_id, projectNames);
	const summary = buildWorkloadSummary(assignments, timeLogged);

	return {
		profile_id: member.profile_id,
		name: `${member.first_name} ${member.last_name}`.trim(),
		avatar_url: member.avatar_url,
		roles: member.roles,
		assignments,
		time_logged: timeLogged,
		summary
	};
}

export function detectOverloads(members: MemberWorkload[]): OverloadWarning[] {
	return members
		.filter((m) => m.summary.overloaded_weeks.length > 0)
		.map((m) => ({
			member_name: m.name,
			profile_id: m.profile_id,
			weeks: m.summary.overloaded_weeks,
			suggestion: findAlternativeAssignee(members, m.profile_id)
		}));
}

function findAlternativeAssignee(
	members: MemberWorkload[],
	overloadedId: string
): string | null {
	const candidates = members
		.filter((m) => m.profile_id !== overloadedId)
		.filter((m) => m.summary.utilization_percentage < 80)
		.sort((a, b) => a.summary.utilization_percentage - b.summary.utilization_percentage);

	if (candidates.length === 0) return null;
	return `${candidates[0].name} (${candidates[0].summary.utilization_percentage}% bezetting)`;
}

function getISOWeek(dateStr: string): string {
	const date = new Date(dateStr);
	const dayOfWeek = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
	const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / DAYS_MS + 1) / 7);
	return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function buildMemberInfoList(
	orgMembers: { profile_id: string }[],
	profiles: Profile[],
	projectMemberRoles: { profile_id: string; role: string }[]
): MemberInfo[] {
	const profileMap = new Map(profiles.map((p) => [p.id, p]));
	const roleMap = new Map<string, Set<string>>();

	for (const pmr of projectMemberRoles) {
		let roles = roleMap.get(pmr.profile_id);
		if (!roles) {
			roles = new Set();
			roleMap.set(pmr.profile_id, roles);
		}
		roles.add(pmr.role);
	}

	return orgMembers
		.map((om) => {
			const profile = profileMap.get(om.profile_id);
			if (!profile) return null;
			const roles = roleMap.get(om.profile_id);
			return {
				profile_id: om.profile_id,
				first_name: profile.first_name,
				last_name: profile.last_name,
				avatar_url: profile.avatar_url,
				roles: roles ? Array.from(roles) : []
			};
		})
		.filter((m): m is MemberInfo => m !== null);
}
