// Dashboard page — load dashboard metrics via API or directly

import type { PageServerLoad } from './$types';
import type {
	DashboardMetrics,
	DashboardRecentProject,
	MonthlyProjectData
} from '$types';

const ACTIVE_STATUSES = ['draft', 'briefing', 'generating', 'review'];
const COMPLETED_STATUSES = ['approved', 'published'];
const RECENT_PROJECTS_LIMIT = 5;
const DEADLINE_DAYS_AHEAD = 7;
const MONTHLY_DATA_MONTHS = 6;

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { hasOrganization } = await parent();
	const { supabase } = locals;

	// Load all projects (non-deleted)
	const { data: projects } = await supabase
		.from('projects')
		.select('id, name, status, current_phase, deadline_date, created_at, updated_at')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	const allProjects = projects ?? [];

	// Load all artifacts for status aggregation
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('id, status, project_id, updated_at');

	const allArtifacts = artifacts ?? [];

	// Load phase activities for progress calculation
	const { data: activities } = await supabase
		.from('phase_activities')
		.select('id, project_id, status')
		.is('deleted_at', null);

	const allActivities = activities ?? [];

	// Calculate metrics
	const activeProjects = allProjects.filter(p => ACTIVE_STATUSES.includes(p.status));
	const completedProjects = allProjects.filter(p => COMPLETED_STATUSES.includes(p.status));
	const inReviewCount = allArtifacts.filter(a => a.status === 'review').length;

	// Week-over-week trend
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	const inReviewTrend = allArtifacts.filter(
		a => a.status === 'review' && new Date(a.updated_at) >= oneWeekAgo
	).length;

	// Sections by status
	const sectionsByStatus: Record<string, number> = {
		draft: allArtifacts.filter(a => a.status === 'draft').length,
		generated: allArtifacts.filter(a => a.status === 'generated').length,
		review: allArtifacts.filter(a => a.status === 'review').length,
		approved: allArtifacts.filter(a => a.status === 'approved').length,
		rejected: allArtifacts.filter(a => a.status === 'rejected').length
	};

	// Average progress (artifacts + activities)
	const progressPerProject = activeProjects.map(p => {
		const projectArtifacts = allArtifacts.filter(a => a.project_id === p.id);
		const projectActivities = allActivities.filter(a => a.project_id === p.id);

		const artifactApproved = projectArtifacts.filter(a => a.status === 'approved').length;
		const activityCompleted = projectActivities.filter(a => a.status === 'completed').length;

		const totalItems = projectArtifacts.length + projectActivities.length;
		const completedItems = artifactApproved + activityCompleted;

		if (totalItems === 0) return 0;
		return Math.round((completedItems / totalItems) * 100);
	});

	const averageProgress = progressPerProject.length > 0
		? Math.round(progressPerProject.reduce((sum, p) => sum + p, 0) / progressPerProject.length)
		: 0;

	// Recent projects with phase and progress
	const recentProjects: DashboardRecentProject[] = allProjects.slice(0, RECENT_PROJECTS_LIMIT).map(p => {
		const projectArtifacts = allArtifacts.filter(a => a.project_id === p.id);
		const projectActivities = allActivities.filter(a => a.project_id === p.id);

		const artifactApproved = projectArtifacts.filter(a => a.status === 'approved').length;
		const activityCompleted = projectActivities.filter(a => a.status === 'completed').length;

		const totalItems = projectArtifacts.length + projectActivities.length;
		const completedItems = artifactApproved + activityCompleted;
		const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

		return {
			id: p.id,
			name: p.name,
			current_phase: p.current_phase,
			deadline_date: p.deadline_date,
			progress,
			updated_at: p.updated_at
		};
	});

	// Upcoming deadlines — combine milestones + activities via stored procedure
	// Also keep project-level deadlines as fallback
	const today = new Date();
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + DEADLINE_DAYS_AHEAD);

	// Try to get organization-wide deadlines from milestones + activities
	let combinedDeadlines: {
		id: string;
		type: string;
		title: string;
		date: string;
		project_id: string;
		project_name: string;
		phase: string;
		status: string;
		is_critical: boolean;
		days_remaining: number;
	}[] = [];

	// Load milestones directly (more reliable than RPC if org_id not available)
	const { data: milestonesData } = await supabase
		.from('milestones')
		.select('id, title, target_date, phase, status, is_critical, project_id, projects!inner(name)')
		.is('deleted_at', null)
		.neq('status', 'completed')
		.gte('target_date', today.toISOString().split('T')[0])
		.lte('target_date', new Date(today.getTime() + DEADLINE_DAYS_AHEAD * 86400000).toISOString().split('T')[0])
		.order('target_date')
		.limit(10);

	// Load activities with due dates
	const { data: activitiesWithDueDate } = await supabase
		.from('phase_activities')
		.select('id, title, due_date, phase, status, project_id, projects!inner(name)')
		.is('deleted_at', null)
		.not('due_date', 'is', null)
		.not('status', 'in', '("completed","skipped")')
		.gte('due_date', today.toISOString().split('T')[0])
		.lte('due_date', new Date(today.getTime() + DEADLINE_DAYS_AHEAD * 86400000).toISOString().split('T')[0])
		.order('due_date')
		.limit(10);

	const todayMs = today.getTime();
	const dayMs = 86400000;

	if (milestonesData) {
		combinedDeadlines.push(
			...milestonesData.map((m) => {
				const projectData = m.projects as unknown as { name: string };
				return {
					id: m.id,
					type: 'milestone',
					title: m.title,
					date: m.target_date,
					project_id: m.project_id,
					project_name: projectData?.name ?? '',
					phase: m.phase ?? '',
					status: m.status,
					is_critical: m.is_critical,
					days_remaining: Math.ceil((new Date(m.target_date).getTime() - todayMs) / dayMs)
				};
			})
		);
	}

	if (activitiesWithDueDate) {
		combinedDeadlines.push(
			...activitiesWithDueDate.map((a) => {
				const projectData = a.projects as unknown as { name: string };
				return {
					id: a.id,
					type: 'activity',
					title: a.title,
					date: a.due_date,
					project_id: a.project_id,
					project_name: projectData?.name ?? '',
					phase: a.phase ?? '',
					status: a.status,
					is_critical: false,
					days_remaining: Math.ceil((new Date(a.due_date).getTime() - todayMs) / dayMs)
				};
			})
		);
	}

	// Sort combined deadlines by date
	combinedDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	// Fallback: project-level deadlines
	const upcomingDeadlines: DashboardRecentProject[] = allProjects
		.filter(p => p.deadline_date && new Date(p.deadline_date) >= today && new Date(p.deadline_date) <= nextWeek)
		.sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime())
		.map(p => ({
			id: p.id,
			name: p.name,
			current_phase: p.current_phase,
			deadline_date: p.deadline_date,
			progress: 0,
			updated_at: p.updated_at
		}));

	// Monthly data (last 6 months) for chart
	const monthlyData: MonthlyProjectData[] = [];
	const now = new Date();

	for (let i = MONTHLY_DATA_MONTHS - 1; i >= 0; i--) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
		const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
		const monthLabel = monthDate.toLocaleDateString('nl-NL', { month: 'short' });

		const started = allProjects.filter(p => {
			const created = new Date(p.created_at);
			return created >= monthDate && created <= monthEnd;
		}).length;

		const completed = allProjects.filter(p => {
			const updated = new Date(p.updated_at);
			return COMPLETED_STATUSES.includes(p.status) && updated >= monthDate && updated <= monthEnd;
		}).length;

		monthlyData.push({ month: monthKey, label: monthLabel, started, completed });
	}

	const metrics: DashboardMetrics = {
		total_projects: allProjects.length,
		active_projects: activeProjects.length,
		completed_projects: completedProjects.length,
		in_review_count: inReviewCount,
		in_review_trend: inReviewTrend,
		average_progress: averageProgress,
		sections_by_status: sectionsByStatus,
		total_sections: allArtifacts.length
	};

	return {
		hasOrganization,
		metrics,
		recentProjects,
		upcomingDeadlines,
		combinedDeadlines,
		monthlyData
	};
};
