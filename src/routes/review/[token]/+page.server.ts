// Review page server load — validates magic link token (no auth required)

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createServiceClient } from '$server/db/client';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createServiceClient();

	const { data: reviewer, error: reviewerError } = await supabase
		.from('section_reviewers')
		.select('*')
		.eq('token', params.token)
		.single();

	if (reviewerError || !reviewer) {
		throw error(404, 'Ongeldige reviewlink. Controleer of de link correct is.');
	}

	if (new Date(reviewer.expires_at) < new Date()) {
		throw error(410, 'Deze reviewlink is verlopen. Vraag een nieuwe link aan bij het projectteam.');
	}

	// Get artifact with project info
	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('id, title, content, section_key, status, version, project_id')
		.eq('id', reviewer.artifact_id)
		.single();

	if (artError || !artifact) {
		throw error(404, 'De bijbehorende sectie kon niet worden gevonden.');
	}

	const { data: project } = await supabase
		.from('projects')
		.select('id, name')
		.eq('id', artifact.project_id)
		.single();

	return {
		reviewer: {
			id: reviewer.id,
			name: reviewer.name,
			email: reviewer.email,
			review_status: reviewer.review_status,
			feedback: reviewer.feedback,
			reviewed_at: reviewer.reviewed_at,
			token: params.token
		},
		artifact: {
			id: artifact.id,
			title: artifact.title,
			content: artifact.content,
			section_key: artifact.section_key,
			version: artifact.version
		},
		project: {
			id: project?.id ?? '',
			name: project?.name ?? ''
		}
	};
};
