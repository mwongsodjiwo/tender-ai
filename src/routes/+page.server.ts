// Root page — redirect to dashboard or login

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

	if (session) {
		throw redirect(303, '/dashboard');
	}

	throw redirect(303, '/login');
};
