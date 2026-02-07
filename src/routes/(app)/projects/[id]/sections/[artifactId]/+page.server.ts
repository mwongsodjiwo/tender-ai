// Section editor page — load artifact, project, document type, conversation, versions

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('id, name, briefing_data, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projectError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	const { data: artifact, error: artError } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(id, name, slug)')
		.eq('id', params.artifactId)
		.eq('project_id', params.id)
		.single();

	if (artError || !artifact) {
		throw error(404, 'Sectie niet gevonden');
	}

	// Load version history
	const { data: versions } = await supabase
		.from('artifact_versions')
		.select('*')
		.eq('artifact_id', params.artifactId)
		.order('version', { ascending: false });

	// Load existing section chat conversation
	const { data: conversations } = await supabase
		.from('conversations')
		.select('id')
		.eq('project_id', params.id)
		.eq('artifact_id', params.artifactId)
		.eq('context_type', 'section_chat')
		.order('created_at', { ascending: false })
		.limit(1);

	const conversationId = conversations?.[0]?.id ?? null;

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
		artifact,
		versions: versions ?? [],
		conversationId,
		messages
	};
};
