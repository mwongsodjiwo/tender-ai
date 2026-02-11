// Deadline aggregation endpoint — combines milestones + phase activities
// GET /api/planning/deadlines?range=week|month|quarter&from=2026-02-10&project_id=xxx&phase=preparing&status=not_started

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DeadlineItem, DeadlineResponse } from '$types';

const RANGE_DAYS: Record<string, number> = {
	week: 7,
	month: 30,
	quarter: 90,
	all: 365
};

const DAYS_MS = 1000 * 60 * 60 * 24;

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'Niet ingelogd');
	}

	// Parse query params
	const range = url.searchParams.get('range') ?? 'month';
	const fromParam = url.searchParams.get('from');
	const projectId = url.searchParams.get('project_id');
	const phaseFilter = url.searchParams.get('phase');
	const statusFilter = url.searchParams.get('status');

	const daysAhead = RANGE_DAYS[range] ?? RANGE_DAYS.month;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const fromDate = fromParam ?? today.toISOString().split('T')[0];
	const toDate = new Date(today.getTime() + daysAhead * DAYS_MS).toISOString().split('T')[0];

	// Build milestones query
	let milestonesQuery = supabase
		.from('milestones')
		.select('id, title, target_date, phase, status, is_critical, project_id, projects!inner(name)')
		.is('deleted_at', null)
		.neq('status', 'completed')
		.lte('target_date', toDate)
		.order('target_date');

	if (projectId) {
		milestonesQuery = milestonesQuery.eq('project_id', projectId);
	}
	if (phaseFilter) {
		milestonesQuery = milestonesQuery.eq('phase', phaseFilter);
	}

	// Build activities query
	let activitiesQuery = supabase
		.from('phase_activities')
		.select('id, title, due_date, phase, status, assigned_to, project_id, projects!inner(name), profiles:assigned_to(full_name)')
		.is('deleted_at', null)
		.not('due_date', 'is', null)
		.not('status', 'in', '("completed","skipped")')
		.lte('due_date', toDate)
		.order('due_date');

	if (projectId) {
		activitiesQuery = activitiesQuery.eq('project_id', projectId);
	}
	if (phaseFilter) {
		activitiesQuery = activitiesQuery.eq('phase', phaseFilter);
	}
	if (statusFilter) {
		milestonesQuery = milestonesQuery.eq('status', statusFilter);
		activitiesQuery = activitiesQuery.eq('status', statusFilter);
	}

	const [milestonesResult, activitiesResult] = await Promise.all([
		milestonesQuery,
		activitiesQuery
	]);

	if (milestonesResult.error) {
		throw error(500, `Fout bij ophalen milestones: ${milestonesResult.error.message}`);
	}
	if (activitiesResult.error) {
		throw error(500, `Fout bij ophalen activiteiten: ${activitiesResult.error.message}`);
	}

	const todayMs = today.getTime();

	// Map milestones to DeadlineItem
	const milestoneItems: DeadlineItem[] = (milestonesResult.data ?? []).map((m) => {
		const targetMs = new Date(m.target_date).getTime();
		const daysRemaining = Math.ceil((targetMs - todayMs) / DAYS_MS);
		const projectData = m.projects as unknown as { name: string };

		return {
			id: m.id,
			type: 'milestone' as const,
			title: m.title,
			date: m.target_date,
			project_id: m.project_id,
			project_name: projectData?.name ?? '',
			phase: m.phase,
			status: m.status,
			is_critical: m.is_critical,
			assigned_to: null,
			assigned_to_name: null,
			days_remaining: daysRemaining,
			is_overdue: daysRemaining < 0
		};
	});

	// Map activities to DeadlineItem
	const activityItems: DeadlineItem[] = (activitiesResult.data ?? []).map((a) => {
		const dueMs = new Date(a.due_date).getTime();
		const daysRemaining = Math.ceil((dueMs - todayMs) / DAYS_MS);
		const projectData = a.projects as unknown as { name: string };
		const profileData = a.profiles as unknown as { full_name: string } | null;

		return {
			id: a.id,
			type: 'activity' as const,
			title: a.title,
			date: a.due_date,
			project_id: a.project_id,
			project_name: projectData?.name ?? '',
			phase: a.phase,
			status: a.status,
			is_critical: false,
			assigned_to: a.assigned_to,
			assigned_to_name: profileData?.full_name ?? null,
			days_remaining: daysRemaining,
			is_overdue: daysRemaining < 0
		};
	});

	// Combine and sort by date
	const items = [...milestoneItems, ...activityItems].sort((a, b) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime();
	});

	// Calculate summary
	const summary = {
		total: items.length,
		overdue: items.filter((i) => i.is_overdue).length,
		this_week: items.filter((i) => i.days_remaining >= 0 && i.days_remaining <= 7).length,
		critical: items.filter((i) => i.is_critical).length
	};

	const response: DeadlineResponse = { items, summary };

	return json(response);
};
