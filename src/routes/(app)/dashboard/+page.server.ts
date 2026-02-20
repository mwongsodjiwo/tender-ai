// Dashboard page — load dashboard metrics via API or directly

import type { PageServerLoad } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	DashboardMetrics,
	DashboardRecentProject,
	MonthlyProjectData,
	MilestoneWithProjectName,
	ActivityWithProjectName,
	ProjectPhase
} from '$types';

const ACTIVE_STATUSES = ['draft', 'briefing', 'generating', 'review'];
const COMPLETED_STATUSES = ['approved', 'published'];
const RECENT_PROJECTS_LIMIT = 5;
const DEADLINE_DAYS_AHEAD = 7;
const MONTHLY_DATA_MONTHS = 6;

interface DashboardData {
	projects: { id: string; name: string; status: string; current_phase: ProjectPhase; deadline_date: string | null; created_at: string; updated_at: string }[];
	artifacts: { id: string; status: string; project_id: string; updated_at: string }[];
	activities: { id: string; project_id: string; status: string }[];
}

async function loadBaseData(supabase: SupabaseClient): Promise<DashboardData> {
	const [projectsRes, artifactsRes, activitiesRes] = await Promise.all([
		supabase.from('projects').select('id, name, status, current_phase, deadline_date, created_at, updated_at').is('deleted_at', null).order('updated_at', { ascending: false }).limit(200),
		supabase.from('artifacts').select('id, status, project_id, updated_at').limit(500),
		supabase.from('phase_activities').select('id, project_id, status').is('deleted_at', null).limit(500)
	]);
	return {
		projects: projectsRes.data ?? [],
		artifacts: artifactsRes.data ?? [],
		activities: activitiesRes.data ?? []
	};
}

function calculateProjectProgress(
	projectId: string,
	artifacts: DashboardData['artifacts'],
	activities: DashboardData['activities']
): number {
	const projectArtifacts = artifacts.filter(a => a.project_id === projectId);
	const projectActivities = activities.filter(a => a.project_id === projectId);
	const completedItems = projectArtifacts.filter(a => a.status === 'approved').length
		+ projectActivities.filter(a => a.status === 'completed').length;
	const totalItems = projectArtifacts.length + projectActivities.length;
	if (totalItems === 0) return 0;
	return Math.round((completedItems / totalItems) * 100);
}

function calculateMetrics(data: DashboardData): DashboardMetrics {
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	// Single-pass: tel artifact statussen en review trend in één loop
	const statusCounts: Record<string, number> = {};
	let recentReviewCount = 0;
	for (const a of data.artifacts) {
		statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
		if (a.status === 'review' && new Date(a.updated_at) >= oneWeekAgo) {
			recentReviewCount++;
		}
	}

	// Single-pass: tel project statussen
	const activeProjects: typeof data.projects = [];
	let completedCount = 0;
	for (const p of data.projects) {
		if (ACTIVE_STATUSES.includes(p.status)) activeProjects.push(p);
		if (COMPLETED_STATUSES.includes(p.status)) completedCount++;
	}

	const progressValues = activeProjects.map(p =>
		calculateProjectProgress(p.id, data.artifacts, data.activities)
	);
	const averageProgress = progressValues.length > 0
		? Math.round(progressValues.reduce((sum, v) => sum + v, 0) / progressValues.length)
		: 0;

	return {
		total_projects: data.projects.length,
		active_projects: activeProjects.length,
		completed_projects: completedCount,
		in_review_count: statusCounts['review'] ?? 0,
		in_review_trend: recentReviewCount,
		average_progress: averageProgress,
		sections_by_status: {
			draft: statusCounts['draft'] ?? 0,
			generated: statusCounts['generated'] ?? 0,
			review: statusCounts['review'] ?? 0,
			approved: statusCounts['approved'] ?? 0,
			rejected: statusCounts['rejected'] ?? 0
		},
		total_sections: data.artifacts.length
	};
}

function buildRecentProjects(data: DashboardData): DashboardRecentProject[] {
	return data.projects.slice(0, RECENT_PROJECTS_LIMIT).map(p => ({
		id: p.id,
		name: p.name,
		current_phase: p.current_phase,
		deadline_date: p.deadline_date,
		progress: calculateProjectProgress(p.id, data.artifacts, data.activities),
		updated_at: p.updated_at
	}));
}

function buildProjectDeadlines(projects: DashboardData['projects']): DashboardRecentProject[] {
	const today = new Date();
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + DEADLINE_DAYS_AHEAD);
	return projects
		.filter(p => p.deadline_date && new Date(p.deadline_date) >= today && new Date(p.deadline_date) <= nextWeek)
		.sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime())
		.map(p => ({
			id: p.id, name: p.name, current_phase: p.current_phase,
			deadline_date: p.deadline_date, progress: 0, updated_at: p.updated_at
		}));
}

function mapMilestoneDeadline(m: MilestoneWithProjectName, todayMs: number, dayMs: number) {
	return {
		id: m.id, type: 'milestone', title: m.title, date: m.target_date,
		project_id: m.project_id, project_name: m.projects?.name ?? '',
		phase: m.phase ?? '', status: m.status, is_critical: m.is_critical,
		days_remaining: Math.ceil((new Date(m.target_date).getTime() - todayMs) / dayMs)
	};
}

function mapActivityDeadline(a: ActivityWithProjectName, todayMs: number, dayMs: number) {
	return {
		id: a.id, type: 'activity', title: a.title, date: a.due_date!,
		project_id: a.project_id, project_name: a.projects?.name ?? '',
		phase: a.phase ?? '', status: a.status, is_critical: false,
		days_remaining: Math.ceil((new Date(a.due_date!).getTime() - todayMs) / dayMs)
	};
}

async function loadCombinedDeadlines(supabase: SupabaseClient) {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];
	const endStr = new Date(today.getTime() + DEADLINE_DAYS_AHEAD * 86400000).toISOString().split('T')[0];
	const [milestonesRes, activitiesRes] = await Promise.all([
		supabase.from('milestones')
			.select('id, title, target_date, phase, status, is_critical, project_id, projects!inner(name)')
			.is('deleted_at', null).neq('status', 'completed')
			.gte('target_date', todayStr).lte('target_date', endStr)
			.order('target_date').limit(10)
			.returns<MilestoneWithProjectName[]>(),
		supabase.from('phase_activities')
			.select('id, title, due_date, phase, status, project_id, projects!inner(name)')
			.is('deleted_at', null).not('due_date', 'is', null)
			.not('status', 'in', '("completed","skipped")')
			.gte('due_date', todayStr).lte('due_date', endStr)
			.order('due_date').limit(10)
			.returns<ActivityWithProjectName[]>()
	]);

	const hasError = !!milestonesRes.error || !!activitiesRes.error;
	const todayMs = today.getTime();
	const dayMs = 86400000;

	const items = [
		...(milestonesRes.data ?? []).map(m => mapMilestoneDeadline(m, todayMs, dayMs)),
		...(activitiesRes.data ?? []).filter(a => a.due_date !== null).map(a => mapActivityDeadline(a, todayMs, dayMs))
	].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return { items, hasError };
}

function buildMonthlyData(projects: DashboardData['projects']): MonthlyProjectData[] {
	const now = new Date();
	const monthlyData: MonthlyProjectData[] = [];
	for (let i = MONTHLY_DATA_MONTHS - 1; i >= 0; i--) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
		const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
		const monthLabel = monthDate.toLocaleDateString('nl-NL', { month: 'short' });
		const started = projects.filter(p => {
			const created = new Date(p.created_at);
			return created >= monthDate && created <= monthEnd;
		}).length;
		const completed = projects.filter(p => {
			const updated = new Date(p.updated_at);
			return COMPLETED_STATUSES.includes(p.status) && updated >= monthDate && updated <= monthEnd;
		}).length;
		monthlyData.push({ month: monthKey, label: monthLabel, started, completed });
	}
	return monthlyData;
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { hasOrganization } = await parent();
	const { supabase } = locals;

	// Parallelliseer onafhankelijke data loads
	const [data, { items: combinedDeadlines, hasError: deadlineError }] = await Promise.all([
		loadBaseData(supabase),
		loadCombinedDeadlines(supabase)
	]);

	const metrics = calculateMetrics(data);
	const recentProjects = buildRecentProjects(data);
	const upcomingDeadlines = buildProjectDeadlines(data.projects);
	const monthlyData = buildMonthlyData(data.projects);

	return {
		hasOrganization,
		metrics,
		recentProjects,
		upcomingDeadlines,
		combinedDeadlines,
		monthlyData,
		deadlineError
	};
};
