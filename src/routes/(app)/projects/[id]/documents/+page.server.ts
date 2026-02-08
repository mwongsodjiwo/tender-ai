// Documents sub-page — load artifacts grouped by type + uploads

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(id, name, slug)')
		.eq('project_id', params.id)
		.order('sort_order');

	const allArtifacts = artifacts ?? [];

	// Group artifacts by document type
	type ArtifactWithType = (typeof allArtifacts)[number];
	const documentBlocks = allArtifacts.reduce<
		Record<
			string,
			{
				docType: { id: string; name: string; slug: string };
				items: ArtifactWithType[];
				total: number;
				approved: number;
				progress: number;
			}
		>
	>((acc, artifact) => {
		const docType = (artifact as Record<string, unknown>).document_type as {
			id: string;
			name: string;
			slug: string;
		} | null;
		const key = docType?.id ?? 'unknown';
		if (!acc[key]) {
			acc[key] = {
				docType: docType ?? { id: 'unknown', name: 'Overig', slug: 'overig' },
				items: [],
				total: 0,
				approved: 0,
				progress: 0
			};
		}
		acc[key].items.push(artifact);
		acc[key].total++;
		if (artifact.status === 'approved') acc[key].approved++;
		acc[key].progress = Math.round((acc[key].approved / acc[key].total) * 100);
		return acc;
	}, {});

	// Load uploaded documents
	const { data: uploadedDocuments } = await supabase
		.from('documents')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	return {
		artifacts: allArtifacts,
		documentBlocks: Object.values(documentBlocks),
		uploadedDocuments: uploadedDocuments ?? []
	};
};
