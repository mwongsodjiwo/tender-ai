// Contract editor page — load document type, artifacts, and contract settings
// Uses the standard document-editor layout (Sprint R6)

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load project with contract settings
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, organization_id, contract_type, general_conditions, briefing_data')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		throw error(404, 'Project niet gevonden');
	}

	// Load the Conceptovereenkomst document type
	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('id, name, slug, description, template_structure, sort_order')
		.eq('slug', 'conceptovereenkomst')
		.single();

	if (dtError || !documentType) {
		throw error(404, 'Documenttype Conceptovereenkomst niet gevonden');
	}

	// Load all artifacts for this project + document type, sorted by sort_order
	const { data: artifacts, error: artError } = await supabase
		.from('artifacts')
		.select('id, title, section_key, content, status, version, sort_order, updated_at')
		.eq('project_id', params.id)
		.eq('document_type_id', documentType.id)
		.order('sort_order');

	if (artError) {
		throw error(500, 'Kon artikelen niet laden');
	}

	const allArtifacts = artifacts ?? [];

	// Load chat conversation (general for this document type)
	let conversationId: string | null = null;
	let chatMessages: { id: string; role: string; content: string; created_at: string }[] = [];

	if (allArtifacts.length > 0) {
		const { data: conversations } = await supabase
			.from('conversations')
			.select('id')
			.eq('project_id', params.id)
			.eq('context_type', 'section_chat')
			.order('created_at', { ascending: false })
			.limit(1);

		conversationId = conversations?.[0]?.id ?? null;

		if (conversationId) {
			const { data: msgs } = await supabase
				.from('messages')
				.select('id, role, content, created_at')
				.eq('conversation_id', conversationId)
				.neq('role', 'system')
				.order('created_at', { ascending: true });
			chatMessages = msgs ?? [];
		}
	}

	// Template sections
	const templateSections = (documentType.template_structure ?? []) as {
		key: string;
		title: string;
		description: string;
	}[];

	return {
		project,
		documentType,
		templateSections,
		artifacts: allArtifacts,
		activeIndex: 0,
		conversationId,
		chatMessages
	};
};
