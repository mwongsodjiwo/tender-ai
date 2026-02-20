// Documents sub-page — load all document types, artifacts grouped by type, EMVI + correspondence

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Correspondence, Evaluation } from '$types';

export const load: PageServerLoad = async ({ params, locals, url, parent }) => {
	const { supabase } = locals;
	await parent(); // Auth guard vanuit layout

	// Determine active tab from URL query parameter
	const activeTab = url.searchParams.get('tab') ?? 'documents';

	// Load all queries in parallel
	const [
		{ data: documentTypes, error: dtError },
		{ data: artifacts, error: artifactError },
		{ data: emviCriteria },
		{ data: uploadedDocuments },
		{ data: lettersData },
		{ data: evaluationsData }
	] = await Promise.all([
		supabase.from('document_types').select('id, name, slug, description, sort_order').eq('is_active', true).order('sort_order'),
		supabase
			.from('artifacts')
			.select('id, title, status, sort_order, document_type:document_types(id, name, slug)')
			.eq('project_id', params.id)
			.order('sort_order'),
		supabase.from('emvi_criteria').select('id').eq('project_id', params.id).is('deleted_at', null),
		supabase.from('documents').select('*').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }),
		supabase.from('correspondence').select('*').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }),
		supabase.from('evaluations').select('*').eq('project_id', params.id).is('deleted_at', null).order('ranking', { ascending: true })
	]);

	if (dtError) {
		throw error(500, 'Kon documenttypes niet laden');
	}
	if (artifactError) {
		throw error(500, 'Kon documenten niet laden');
	}

	const allDocTypes = documentTypes ?? [];
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

	const emviCount = emviCriteria?.length ?? 0;
	const letters: Correspondence[] = (lettersData ?? []) as Correspondence[];
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
