// Marktverkenning page — load project profile and saved market research content

import type { PageServerLoad } from './$types';
import type { ProjectProfile, PhaseActivity } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load project profile
	const { data: profileData } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	const profile: ProjectProfile | null = profileData as ProjectProfile | null;

	// Load exploring phase activities (saved market research content)
	const { data: activitiesData } = await supabase
		.from('phase_activities')
		.select('*')
		.eq('project_id', params.id)
		.eq('phase', 'exploring')
		.is('deleted_at', null)
		.order('sort_order');

	const activities: PhaseActivity[] = (activitiesData ?? []) as PhaseActivity[];

	// Extract saved content per activity type from metadata
	const savedContent: Record<string, string> = {};
	for (const activity of activities) {
		const meta = activity.metadata as Record<string, unknown> | null;
		if (meta?.content && typeof meta.content === 'string') {
			savedContent[activity.activity_type] = meta.content;
		}
	}

	return {
		profile,
		activities,
		savedContent
	};
};
