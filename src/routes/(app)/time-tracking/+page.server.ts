// Time tracking — Week overview page data loading

import type { PageServerLoad } from './$types';
import { toISOWeekString, getWeekMonday, formatDateISO } from '$lib/utils/week';

const WEEKEND_OFFSET = 6;

export const load: PageServerLoad = async ({ url, locals, parent }) => {
	// Wait for layout auth guard to complete first
	await parent();

	const { supabase, user } = locals;

	// If no user (should not happen after layout guard, but be safe)
	if (!user) {
		return { entries: [], projects: [], currentWeek: toISOWeekString(new Date()) };
	}

	// Determine which week to show
	const weekParam = url.searchParams.get('week');
	const currentWeek = weekParam ?? toISOWeekString(new Date());

	// Calculate date range for this week
	const monday = getWeekMonday(currentWeek);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + WEEKEND_OFFSET);

	const fromDate = formatDateISO(monday);
	const toDate = formatDateISO(sunday);

	// Load time entries and projects in parallel
	const [entriesResult, projectsResult] = await Promise.all([
		supabase
			.from('time_entries')
			.select('*, project:projects!time_entries_project_id_fkey(id, name)')
			.eq('user_id', user.id)
			.gte('date', fromDate)
			.lte('date', toDate)
			.order('date', { ascending: true })
			.order('created_at', { ascending: true }),
		supabase
			.from('projects')
			.select('id, name')
			.is('deleted_at', null)
			.order('name', { ascending: true })
	]);

	if (entriesResult.error) {
		console.error('Failed to load time entries:', entriesResult.error.message);
	}

	return {
		entries: entriesResult.data ?? [],
		projects: projectsResult.data ?? [],
		currentWeek
	};
};
