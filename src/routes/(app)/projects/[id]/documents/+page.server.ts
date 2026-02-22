// Documents sub-page — load document types, artifacts, correspondence
// Separates active and archived items by archive_status

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Correspondence, Evaluation, MilestoneType } from '$types';

type ArtifactRow = {
	id: string; title: string; status: string; sort_order: number;
	archive_status: string | null;
	document_type: { id: string; name: string; slug: string } | null;
	section_reviewers?: { name: string; email: string }[];
};
type AuditRow = {
	action: string;
	actor_name: string | null;
	entity_type: string;
	entity_id: string | null;
	created_at: string;
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

import type { DocumentStatus } from '$lib/types/enums/document.js';

function deriveDocumentStatus(items: ArtifactRow[]): DocumentStatus {
	if (items.length === 0) return 'open';
	const allApproved = items.every((i) => i.status === 'approved');
	if (allApproved) return 'afgerond';
	const hasWork = items.some((i) => i.status !== 'draft');
	return hasWork ? 'gestart' : 'open';
}

function collectReviewers(items: ArtifactRow[]): { name: string; email: string }[] {
	const seen = new Set<string>();
	const result: { name: string; email: string }[] = [];
	for (const item of items) {
		for (const r of item.section_reviewers ?? []) {
			if (!seen.has(r.email)) { seen.add(r.email); result.push(r); }
		}
	}
	return result;
}

function buildAuditMap(auditRows: AuditRow[], artifactsByType: Record<string, ArtifactRow[]>, allTypeIds: string[]) {
	const artifactToType: Record<string, string> = {};
	for (const [typeId, items] of Object.entries(artifactsByType)) {
		for (const a of items) artifactToType[a.id] = typeId;
	}
	const byType: Record<string, AuditRow[]> = {};
	for (const tid of allTypeIds) byType[tid] = [];
	for (const row of auditRows) {
		if (row.entity_id) {
			const typeId = artifactToType[row.entity_id];
			if (typeId) byType[typeId].push(row);
			// entity_id exists but doesn't match an artifact → skip (belongs to correspondence/evaluation/etc.)
		} else {
			// No entity_id → project-wide action: add to ALL document types
			for (const tid of allTypeIds) byType[tid].push(row);
		}
	}
	return byType;
}

function buildBlocks(docTypes: DocType[], artifacts: ArtifactRow[], auditRows: AuditRow[]) {
	const byType: Record<string, ArtifactRow[]> = {};
	for (const a of artifacts) {
		const key = a.document_type?.id ?? 'unknown';
		if (!byType[key]) byType[key] = [];
		byType[key].push(a);
	}
	const allTypeIds = docTypes.map((dt) => dt.id);
	const auditByType = buildAuditMap(auditRows, byType, allTypeIds);
	return docTypes.map((dt) => {
		const items = byType[dt.id] ?? [];
		const total = items.length;
		const approved = items.filter((i) => i.status === 'approved').length;
		const status = deriveDocumentStatus(items);
		const reviewers = collectReviewers(items);
		const history = (auditByType[dt.id] ?? []).slice(0, 5).map((h) => ({
			action: h.action,
			actor_name: h.actor_name,
			entity_type: h.entity_type, created_at: h.created_at
		}));
		return {
			id: dt.id, name: dt.name, slug: dt.slug, description: dt.description,
			items, total, approved, status, reviewers, history
		};
	});
}

function processArtifactsAndLetters(
	docTypes: DocType[], rawArtifacts: unknown[], rawLetters: Correspondence[],
	auditRows: AuditRow[]
) {
	const all = rawArtifacts as ArtifactRow[];
	const active = all.filter((a) => isActive(a.archive_status));
	const archived = all.filter((a) => a.archive_status === 'archived');
	return {
		artifacts: active,
		productBlocks: buildBlocks(docTypes, active, auditRows),
		archivedProductBlocks: buildBlocks(docTypes, archived, []).filter((b) => b.total > 0),
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
		supabase.from('artifacts').select('id, title, status, sort_order, archive_status, document_type:document_types(id, name, slug), section_reviewers(name, email)').eq('project_id', params.id).order('sort_order'),
		supabase.from('emvi_criteria').select('id').eq('project_id', params.id).is('deleted_at', null),
		supabase.from('documents').select('*').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }),
		supabase.from('correspondence').select('*').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }),
		supabase.from('evaluations').select('*').eq('project_id', params.id).is('deleted_at', null).order('ranking', { ascending: true }),
		supabase.from('milestones').select('milestone_type, target_date, title').eq('project_id', params.id).is('deleted_at', null).order('target_date')
	]);

	// Two separate queries to avoid FK join issues with profiles
	let auditRows: AuditRow[] = [];
	try {
		const { data: rawAudit } = await supabase
			.from('audit_log')
			.select('action, actor_email, actor_id, entity_type, entity_id, created_at')
			.eq('project_id', params.id)
			.order('created_at', { ascending: false })
			.limit(100);
		if (rawAudit && rawAudit.length > 0) {
			const actorIds = [...new Set(rawAudit.map((r) => r.actor_id).filter(Boolean))] as string[];
			const profileMap: Record<string, string> = {};
			if (actorIds.length > 0) {
				const { data: profiles } = await supabase
					.from('profiles').select('id, first_name, last_name').in('id', actorIds);
				for (const p of profiles ?? []) profileMap[p.id] = `${p.first_name} ${p.last_name}`.trim();
			}
			auditRows = rawAudit.map((r) => ({
				action: r.action,
				actor_name: (r.actor_id ? profileMap[r.actor_id] : null) ?? r.actor_email ?? null,
				entity_type: r.entity_type,
				entity_id: r.entity_id,
				created_at: r.created_at
			}));
		}
	} catch {
		// Audit log is non-critical — continue without history
	}

	if (dtError || artErr) throw error(500, 'Kon documenten niet laden');
	const processed = processArtifactsAndLetters(
		documentTypes ?? [], (artifacts ?? []) as unknown[], (lettersData ?? []) as Correspondence[],
		auditRows
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
