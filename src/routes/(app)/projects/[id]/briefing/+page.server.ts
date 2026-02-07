// Briefing page — load project and existing conversation

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projectError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	// Find existing briefing conversation
	const { data: conversations } = await supabase
		.from('conversations')
		.select('id')
		.eq('project_id', params.id)
		.eq('context_type', 'briefing')
		.order('created_at', { ascending: false })
		.limit(1);

	const conversationId = conversations?.[0]?.id ?? null;

	// Load messages if conversation exists
	let messages: { id: string; role: string; content: string; created_at: string }[] = [];
	if (conversationId) {
		const { data: msgs } = await supabase
			.from('messages')
			.select('id, role, content, created_at')
			.eq('conversation_id', conversationId)
			.neq('role', 'system')
			.order('created_at', { ascending: true });
		messages = msgs ?? [];
	}

	return {
		project,
		conversationId,
		messages
	};
};
