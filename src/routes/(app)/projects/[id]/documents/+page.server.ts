// Documents sub-page — load all document types, artifacts grouped by type, EMVI + uploads

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load all active document types
	const { data: documentTypes } = await supabase
		.from('document_types')
		.select('id, name, slug, description, sort_order')
		.eq('is_active', true)
		.order('sort_order');

	const allDocTypes = documentTypes ?? [];

	// Load all artifacts for this project
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(id, name, slug)')
		.eq('project_id', params.id)
		.order('sort_order');

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

	// Build product blocks for each document type (including those without artifacts)
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

	// Load EMVI criteria count for EMVI product card
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

	return {
		artifacts: allArtifacts,
		productBlocks,
		emviCount,
		uploadedDocuments: uploadedDocuments ?? []
	};
};
