// Documents sub-page — load document types, artifacts, correspondence
// Separates active and archived items by archive_status

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Correspondence, Evaluation, MilestoneType } from '$types';

type ArtifactRow = {
	id: string; title: string; status: string; sort_order: number;
	archive_status: string | null;
	document_type: { id: string; name: string; slug: string } | null;
};

type DocType = {
	id: string; name: string; slug: string;
	description: string | null; sort_order: number;
};

type MilestoneRow = {
	milestone_type: MilestoneType;
	target_date: string;
	title: string;
};

const isActive = (s: string | null): boolean => !s || s === 'active';

function buildBlocks(docTypes: DocType[], artifacts: ArtifactRow[]) {
	const byType: Record<string, ArtifactRow[]> = {};
	for (const a of artifacts) {
		const key = a.document_type?.id ?? 'unknown';
		if (!byType[key]) byType[key] = [];
		byType[key].push(a);
	}
	return docTypes.map((dt) => {
		const items = byType[dt.id] ?? [];
		const total = items.length;
		const approved = items.filter((i) => i.status === 'approved').length;
		return {
			id: dt.id, name: dt.name, slug: dt.slug, description: dt.description,
			items, total, approved,
			progress: total > 0 ? Math.round((approved / total) * 100) : 0
		};
	});
}

function processArtifactsAndLetters(
	docTypes: DocType[], rawArtifacts: unknown[], rawLetters: Correspondence[]
) {
	const all = rawArtifacts as ArtifactRow[];
	const active = all.filter((a) => isActive(a.archive_status));
	const archived = all.filter((a) => a.archive_status === 'archived');
	return {
		artifacts: active,
		productBlocks: buildBlocks(docTypes, active),
		archivedProductBlocks: buildBlocks(docTypes, archived).filter((b) => b.total > 0),
		letters: rawLetters.filter((l) => isActive(l.archive_status)),
		archivedLetters: rawLetters.filter((l) => l.archive_status === 'archived')
	};
}

/** Pick the next future deadline, or the most recent past one if all expired. */
function computeNextDeadline(milestones: MilestoneRow[]): string | null {
	if (milestones.length === 0) return null;
	const now = new Date().toISOString().split('T')[0];
	const future = milestones
		.filter((m) => m.target_date >= now)
		.sort((a, b) => a.target_date.localeCompare(b.target_date));
	if (future.length > 0) return future[0].target_date;
	const past = [...milestones].sort(
		(a, b) => b.target_date.localeCompare(a.target_date)
	);
	return past[0].target_date;
}

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { supabase } = locals;
	await parent();

	const [
		{ data: documentTypes, error: dtError },
		{ data: artifacts, error: artErr },
		{ data: emviCriteria },
		{ data: uploadedDocuments },
		{ data: lettersData },
		{ data: evaluationsData },
		{ data: milestonesData }
	] = await Promise.all([
		supabase.from('document_types').select('id, name, slug, description, sort_order').eq('is_active', true).order('sort_order'),
		supabase.from('artifacts').select('id, title, status, sort_order, archive_status, document_type:document_types(id, name, slug)').eq('project_id', params.id).order('sort_order'),
		supabase.from('emvi_criteria').select('id').eq('project_id', params.id).is('deleted_at', null),
		supabase.from('documents').select('*').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }),
		supabase.from('correspondence').select('*').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }),
		supabase.from('evaluations').select('*').eq('project_id', params.id).is('deleted_at', null).order('ranking', { ascending: true }),
		supabase.from('milestones').select('milestone_type, target_date, title').eq('project_id', params.id).is('deleted_at', null).order('target_date')
	]);

	if (dtError || artErr) throw error(500, 'Kon documenten niet laden');
	const processed = processArtifactsAndLetters(
		documentTypes ?? [], (artifacts ?? []) as unknown[], (lettersData ?? []) as Correspondence[]
	);

	const nextDeadline = computeNextDeadline((milestonesData ?? []) as MilestoneRow[]);

	return {
		...processed,
		nextDeadline,
		emviCount: emviCriteria?.length ?? 0,
		uploadedDocuments: uploadedDocuments ?? [],
		evaluations: (evaluationsData ?? []) as Evaluation[]
	};
};
