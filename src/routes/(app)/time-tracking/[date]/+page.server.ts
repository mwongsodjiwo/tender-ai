// Time tracking — Day view page data loading

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	// Wait for layout auth guard
	await parent();

	const { supabase, user } = locals;
	const { date } = params;

	if (!user) {
		return { entries: [], projects: [], date };
	}

	// Validate date format
	if (!DATE_REGEX.test(date)) {
		throw error(400, 'Ongeldige datum. Gebruik formaat YYYY-MM-DD.');
	}

	// Load entries and projects in parallel
	const [entriesResult, projectsResult] = await Promise.all([
		supabase
			.from('time_entries')
			.select('*, project:projects!time_entries_project_id_fkey(id, name)')
			.eq('user_id', user.id)
			.eq('date', date)
			.order('created_at', { ascending: true }),
		supabase
			.from('projects')
			.select('id, name')
			.is('deleted_at', null)
			.order('name', { ascending: true })
	]);

	return {
		entries: entriesResult.data ?? [],
		projects: projectsResult.data ?? [],
		date
	};
};
