// Documents sub-page — load all document types, artifacts grouped by type, EMVI + correspondence

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Correspondence, Evaluation } from '$types';

export const load: PageServerLoad = async ({ params, locals, url, parent }) => {
	const { supabase } = locals;
	await parent(); // Auth guard vanuit layout

	// Determine active tab from URL query parameter
	const activeTab = url.searchParams.get('tab') ?? 'documents';

	// Load all active document types
	const { data: documentTypes, error: dtError } = await supabase
		.from('document_types')
		.select('id, name, slug, description, sort_order')
		.eq('is_active', true)
		.order('sort_order');

	if (dtError) {
		throw error(500, 'Kon documenttypes niet laden');
	}

	const allDocTypes = documentTypes ?? [];

	// Load all artifacts for this project
	const { data: artifacts, error: artifactError } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(id, name, slug)')
		.eq('project_id', params.id)
		.order('sort_order');

	if (artifactError) {
		throw error(500, 'Kon documenten niet laden');
	}

	const allArtifacts = artifacts ?? [];

	// Group artifacts by document type id
	const artifactsByType: Record<string, typeof allArtifacts> = {};
	for (const artifact of allArtifacts) {
		const docType = (artifact as Record<string, unknown>).document_type as {
			id: string;
			name: string;
			slug: string;
		} | null;
		const key = docType?.id ?? 'unknown';
		if (!artifactsByType[key]) artifactsByType[key] = [];
		artifactsByType[key].push(artifact);
	}

	// Build product blocks for each document type
	const productBlocks = allDocTypes.map((dt) => {
		const items = artifactsByType[dt.id] ?? [];
		const total = items.length;
		const approved = items.filter((a) => a.status === 'approved').length;
		return {
			id: dt.id,
			name: dt.name,
			slug: dt.slug,
			description: dt.description,
			items,
			total,
			approved,
			progress: total > 0 ? Math.round((approved / total) * 100) : 0
		};
	});

	// Load EMVI criteria count
	const { data: emviCriteria } = await supabase
		.from('emvi_criteria')
		.select('id')
		.eq('project_id', params.id)
		.is('deleted_at', null);

	const emviCount = emviCriteria?.length ?? 0;

	// Load uploaded documents
	const { data: uploadedDocuments } = await supabase
		.from('documents')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	// Load correspondence for this project
	const { data: lettersData } = await supabase
		.from('correspondence')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const letters: Correspondence[] = (lettersData ?? []) as Correspondence[];

	// Load evaluations (for context with rejection letters)
	const { data: evaluationsData } = await supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('ranking', { ascending: true });

	const evaluations: Evaluation[] = (evaluationsData ?? []) as Evaluation[];

	return {
		activeTab,
		artifacts: allArtifacts,
		productBlocks,
		emviCount,
		uploadedDocuments: uploadedDocuments ?? [],
		letters,
		evaluations
	};
};
