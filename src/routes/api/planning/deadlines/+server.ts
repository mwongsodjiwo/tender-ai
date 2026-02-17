// Deadline aggregation endpoint — combines milestones + phase activities
// GET /api/planning/deadlines?range=week|month|quarter&from=2026-02-10&project_id=xxx&phase=preparing&status=not_started

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	DeadlineItem,
	DeadlineResponse,
	MilestoneWithProjectName,
	ActivityWithProjectAndProfile
} from '$types';

const RANGE_DAYS: Record<string, number> = {
	week: 7,
	month: 30,
	quarter: 90,
	all: 365
};

const DAYS_MS = 1000 * 60 * 60 * 24;

interface DeadlineFilters {
	fromDate: string;
	toDate: string;
	projectId: string | null;
	phaseFilter: string | null;
	statusFilter: string | null;
}

function parseDeadlineParams(url: URL): DeadlineFilters {
	const range = url.searchParams.get('range') ?? 'month';
	const fromParam = url.searchParams.get('from');
	const daysAhead = RANGE_DAYS[range] ?? RANGE_DAYS.month;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return {
		fromDate: fromParam ?? today.toISOString().split('T')[0],
		toDate: new Date(today.getTime() + daysAhead * DAYS_MS).toISOString().split('T')[0],
		projectId: url.searchParams.get('project_id'),
		phaseFilter: url.searchParams.get('phase'),
		statusFilter: url.searchParams.get('status')
	};
}

function buildMilestonesQuery(supabase: SupabaseClient, filters: DeadlineFilters) {
	let query = supabase
		.from('milestones')
		.select('id, title, target_date, phase, status, is_critical, project_id, projects!inner(name)')
		.is('deleted_at', null)
		.neq('status', 'completed')
		.lte('target_date', filters.toDate)
		.order('target_date');
	if (filters.projectId) query = query.eq('project_id', filters.projectId);
	if (filters.phaseFilter) query = query.eq('phase', filters.phaseFilter);
	if (filters.statusFilter) query = query.eq('status', filters.statusFilter);
	return query.returns<MilestoneWithProjectName[]>();
}

function buildActivitiesQuery(supabase: SupabaseClient, filters: DeadlineFilters) {
	let query = supabase
		.from('phase_activities')
		.select('id, title, due_date, phase, status, assigned_to, project_id, projects!inner(name), profiles:assigned_to(full_name)')
		.is('deleted_at', null)
		.not('due_date', 'is', null)
		.not('status', 'in', '("completed","skipped")')
		.lte('due_date', filters.toDate)
		.order('due_date');
	if (filters.projectId) query = query.eq('project_id', filters.projectId);
	if (filters.phaseFilter) query = query.eq('phase', filters.phaseFilter);
	if (filters.statusFilter) query = query.eq('status', filters.statusFilter);
	return query.returns<ActivityWithProjectAndProfile[]>();
}

function mapMilestonesToDeadlines(milestones: MilestoneWithProjectName[], todayMs: number): DeadlineItem[] {
	return milestones.map((m) => {
		const daysRemaining = Math.ceil((new Date(m.target_date).getTime() - todayMs) / DAYS_MS);
		return {
			id: m.id, type: 'milestone' as const, title: m.title, date: m.target_date,
			project_id: m.project_id, project_name: m.projects?.name ?? '',
			phase: m.phase ?? 'preparing', status: m.status, is_critical: m.is_critical,
			assigned_to: null, assigned_to_name: null,
			days_remaining: daysRemaining, is_overdue: daysRemaining < 0
		};
	});
}

function mapActivitiesToDeadlines(activities: ActivityWithProjectAndProfile[], todayMs: number): DeadlineItem[] {
	return activities
		.filter((a) => a.due_date !== null)
		.map((a) => {
			const daysRemaining = Math.ceil((new Date(a.due_date!).getTime() - todayMs) / DAYS_MS);
			return {
				id: a.id, type: 'activity' as const, title: a.title, date: a.due_date!,
				project_id: a.project_id, project_name: a.projects?.name ?? '',
				phase: a.phase, status: a.status, is_critical: false,
				assigned_to: a.assigned_to, assigned_to_name: a.profiles?.full_name ?? null,
				days_remaining: daysRemaining, is_overdue: daysRemaining < 0
			};
		});
}

function calculateSummary(items: DeadlineItem[]) {
	return {
		total: items.length,
		overdue: items.filter((i) => i.is_overdue).length,
		this_week: items.filter((i) => i.days_remaining >= 0 && i.days_remaining <= 7).length,
		critical: items.filter((i) => i.is_critical).length
	};
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, session } = locals;
	if (!session) throw error(401, 'Niet ingelogd');

	const filters = parseDeadlineParams(url);

	const [milestonesResult, activitiesResult] = await Promise.all([
		buildMilestonesQuery(supabase, filters),
		buildActivitiesQuery(supabase, filters)
	]);

	if (milestonesResult.error) {
		throw error(500, `Fout bij ophalen milestones: ${milestonesResult.error.message}`);
	}
	if (activitiesResult.error) {
		throw error(500, `Fout bij ophalen activiteiten: ${activitiesResult.error.message}`);
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayMs = today.getTime();

	const milestoneItems = mapMilestonesToDeadlines(milestonesResult.data ?? [], todayMs);
	const activityItems = mapActivitiesToDeadlines(activitiesResult.data ?? [], todayMs);
	const items = [...milestoneItems, ...activityItems].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	);

	const response: DeadlineResponse = { items, summary: calculateSummary(items) };
	return json(response);
};
