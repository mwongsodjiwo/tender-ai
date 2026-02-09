// Time tracking — Reports page data loading

import type { PageServerLoad } from './$types';
import { TIME_ENTRY_ACTIVITY_TYPE_LABELS } from '$types';
import type { TimeEntryActivityType } from '$types';

const DEFAULT_PERIOD = 'month';
const WEEKS_IN_PERIOD: Record<string, number> = {
	week: 1,
	month: 4,
	quarter: 13,
	year: 52
};

export const load: PageServerLoad = async ({ url, locals, parent }) => {
	// Wait for layout auth guard
	await parent();

	const { supabase, user } = locals;

	if (!user) {
		return {
			entries: [],
			totalHours: 0,
			byProject: [],
			byActivity: [],
			byWeek: [],
			projects: [],
			period: DEFAULT_PERIOD,
			projectFilter: null,
			fromDate: '',
			toDate: ''
		};
	}

	const period = url.searchParams.get('period') ?? DEFAULT_PERIOD;
	const projectFilter = url.searchParams.get('project_id') ?? null;
	const customFrom = url.searchParams.get('from') ?? null;
	const customTo = url.searchParams.get('to') ?? null;

	// Calculate date range based on period
	const now = new Date();
	let fromDate: string;
	let toDate: string;

	if (customFrom && customTo) {
		fromDate = customFrom;
		toDate = customTo;
	} else {
		toDate = formatDate(now);

		const start = new Date(now);
		const weeksBack = WEEKS_IN_PERIOD[period] ?? WEEKS_IN_PERIOD.month;
		start.setDate(start.getDate() - weeksBack * 7);
		fromDate = formatDate(start);
	}

	// Build query
	let query = supabase
		.from('time_entries')
		.select('*, project:projects!time_entries_project_id_fkey(id, name)')
		.eq('user_id', user.id)
		.gte('date', fromDate)
		.lte('date', toDate)
		.order('date', { ascending: true });

	if (projectFilter) {
		query = query.eq('project_id', projectFilter);
	}

	const { data: entries } = await query;
	const allEntries = entries ?? [];

	// Total hours
	const totalHours = allEntries.reduce((sum, e) => sum + Number(e.hours), 0);

	// By project
	const projectMap = new Map<string, { project_id: string; project_name: string; hours: number }>();
	for (const entry of allEntries) {
		const pid = entry.project_id;
		const existing = projectMap.get(pid);
		const projectName = (entry.project as { name: string } | null)?.name ?? 'Onbekend';
		if (existing) {
			existing.hours += Number(entry.hours);
		} else {
			projectMap.set(pid, { project_id: pid, project_name: projectName, hours: Number(entry.hours) });
		}
	}
	const byProject = Array.from(projectMap.values())
		.sort((a, b) => b.hours - a.hours)
		.map(p => ({
			...p,
			percentage: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0
		}));

	// By activity
	const activityMap = new Map<string, number>();
	for (const entry of allEntries) {
		const key = entry.activity_type;
		activityMap.set(key, (activityMap.get(key) ?? 0) + Number(entry.hours));
	}
	const byActivity = Array.from(activityMap.entries())
		.sort((a, b) => b[1] - a[1])
		.map(([actType, hours]) => ({
			activity_type: actType as TimeEntryActivityType,
			label: TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType as TimeEntryActivityType] ?? actType,
			hours,
			percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0
		}));

	// By week (for trend chart)
	const weekMap = new Map<string, number>();
	for (const entry of allEntries) {
		const entryDate = new Date(entry.date);
		const weekKey = getWeekKey(entryDate);
		weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + Number(entry.hours));
	}
	const byWeek = Array.from(weekMap.entries())
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([week, hours]) => ({
			week,
			label: `W${week.split('-W')[1]}`,
			hours
		}));

	// Load projects for filter dropdown
	const { data: projects } = await supabase
		.from('projects')
		.select('id, name')
		.is('deleted_at', null)
		.order('name', { ascending: true });

	return {
		entries: allEntries,
		totalHours,
		byProject,
		byActivity,
		byWeek,
		projects: projects ?? [],
		period,
		projectFilter,
		fromDate,
		toDate
	};
};

function formatDate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey(date: Date): string {
	const DAYS_IN_WEEK = 7;
	const THURSDAY_INDEX = 4;
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || DAYS_IN_WEEK;
	d.setUTCDate(d.getUTCDate() + THURSDAY_INDEX - dayNum);
	const year = d.getUTCFullYear();
	const yearStart = new Date(Date.UTC(year, 0, 1));
	const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / DAYS_IN_WEEK);
	return `${year}-W${String(weekNum).padStart(2, '0')}`;
}
