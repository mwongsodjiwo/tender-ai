// Dashboard page — load projects and dashboard metrics

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { hasOrganization } = await parent();
	const { supabase } = locals;

	// Load all projects (non-deleted)
	const { data: projects } = await supabase
		.from('projects')
		.select('*')
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });

	const allProjects = projects ?? [];

	// Load all artifacts for status aggregation
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('id, status, project_id, updated_at');

	const allArtifacts = artifacts ?? [];

	// Calculate dashboard metrics
	const activeStatuses = ['draft', 'briefing', 'generating', 'review'];
	const activeProjects = allProjects.filter(p => activeStatuses.includes(p.status));
	const completedProjects = allProjects.filter(p => p.status === 'approved' || p.status === 'published');

	// Documents (artifacts) in review
	const inReviewCount = allArtifacts.filter(a => a.status === 'review').length;

	// Review count from 7 days ago for trend
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	const recentlyMovedToReview = allArtifacts.filter(a =>
		a.status === 'review' && new Date(a.updated_at) >= oneWeekAgo
	).length;

	// Sections per status aggregation
	const sectionsByStatus = {
		draft: allArtifacts.filter(a => a.status === 'draft').length,
		generated: allArtifacts.filter(a => a.status === 'generated').length,
		review: allArtifacts.filter(a => a.status === 'review').length,
		approved: allArtifacts.filter(a => a.status === 'approved').length,
		rejected: allArtifacts.filter(a => a.status === 'rejected').length
	};

	const totalSections = allArtifacts.length;

	// Deadlines coming week
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);
	const today = new Date();
	const upcomingDeadlines = allProjects
		.filter(p => p.deadline_date && new Date(p.deadline_date) >= today && new Date(p.deadline_date) <= nextWeek)
		.sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime());

	// Average progress of active projects (based on artifact statuses)
	const progressPerProject = activeProjects.map(p => {
		const projectArtifacts = allArtifacts.filter(a => a.project_id === p.id);
		if (projectArtifacts.length === 0) return 0;
		const approvedCount = projectArtifacts.filter(a => a.status === 'approved').length;
		return Math.round((approvedCount / projectArtifacts.length) * 100);
	});
	const averageProgress = progressPerProject.length > 0
		? Math.round(progressPerProject.reduce((sum, p) => sum + p, 0) / progressPerProject.length)
		: 0;

	// Recent projects (top 5)
	const recentProjects = allProjects.slice(0, 5).map(p => {
		const projectArtifacts = allArtifacts.filter(a => a.project_id === p.id);
		const approvedCount = projectArtifacts.filter(a => a.status === 'approved').length;
		const progress = projectArtifacts.length > 0
			? Math.round((approvedCount / projectArtifacts.length) * 100)
			: 0;
		return { ...p, progress };
	});

	return {
		projects: allProjects,
		hasOrganization,
		metrics: {
			totalProjects: allProjects.length,
			activeProjects: activeProjects.length,
			completedProjects: completedProjects.length,
			inReviewCount,
			recentlyMovedToReview,
			averageProgress,
			sectionsByStatus,
			totalSections
		},
		recentProjects,
		upcomingDeadlines
	};
};
