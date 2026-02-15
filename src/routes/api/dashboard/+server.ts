// GET /api/dashboard — Dashboard metrics and data

import type { RequestHandler } from './$types';
import type {
	DashboardResponse,
	DashboardRecentProject,
	DashboardMetrics,
	MonthlyProjectData
} from '$types';
import { apiError, apiSuccess } from '$server/api/response';

const ACTIVE_STATUSES = ['draft', 'briefing', 'generating', 'review'];
const COMPLETED_STATUSES = ['approved', 'published'];
const RECENT_PROJECTS_LIMIT = 5;
const DEADLINE_DAYS_AHEAD = 7;
const MONTHLY_DATA_MONTHS = 6;

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Load all projects (non-deleted)
	const { data: projects, error: projectsError } = await supabase
		.from('projects')
		.select('id, name, status, current_phase, deadline_date, created_at, updated_at')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	if (projectsError) {
		return apiError(500, 'DB_ERROR', projectsError.message);
	}

	const allProjects = projects ?? [];

	// Load all artifacts for status aggregation
	const { data: artifacts, error: artifactsError } = await supabase
		.from('artifacts')
		.select('id, status, project_id, updated_at');

	if (artifactsError) {
		return apiError(500, 'DB_ERROR', artifactsError.message);
	}

	const allArtifacts = artifacts ?? [];

	// Load phase activities for progress calculation
	const { data: activities, error: activitiesError } = await supabase
		.from('phase_activities')
		.select('id, project_id, status')
		.is('deleted_at', null);

	if (activitiesError) {
		return apiError(500, 'DB_ERROR', activitiesError.message);
	}

	const allActivities = activities ?? [];

	// Calculate metrics
	const activeProjects = allProjects.filter(p => ACTIVE_STATUSES.includes(p.status));
	const completedProjects = allProjects.filter(p => COMPLETED_STATUSES.includes(p.status));
	const inReviewCount = allArtifacts.filter(a => a.status === 'review').length;

	// Week-over-week trend for review count
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

	// Average progress — combine artifact + activity progress
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

	// Recent projects with progress
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

	// Upcoming deadlines
	const today = new Date();
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + DEADLINE_DAYS_AHEAD);

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

	const response: DashboardResponse = {
		metrics,
		recent_projects: recentProjects,
		upcoming_deadlines: upcomingDeadlines,
		monthly_data: monthlyData
	};

	return apiSuccess(response);
};
