// Project overview page — load artifacts, activities, metrics, and recent activity

import type { PageServerLoad } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PhaseActivity, ArtifactWithDocType } from '$types';

interface ReviewerRow {
	artifact_id: string;
	name: string;
	email: string;
	review_status: string;
}

async function loadArtifacts(supabase: SupabaseClient, projectId: string) {
	const { data } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(id, name, slug)')
		.eq('project_id', projectId)
		.order('sort_order')
		.returns<ArtifactWithDocType[]>();
	return data ?? [];
}

async function loadPhaseActivities(supabase: SupabaseClient, projectId: string): Promise<PhaseActivity[]> {
	const { data } = await supabase
		.from('phase_activities')
		.select('*')
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.order('sort_order');
	return (data ?? []) as PhaseActivity[];
}

async function loadProjectProfile(supabase: SupabaseClient, projectId: string) {
	const { data } = await supabase
		.from('project_profiles')
		.select('id, contracting_authority, project_goal, planning_generated_at')
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.maybeSingle();
	return data;
}

async function loadReviewers(supabase: SupabaseClient, artifactIds: string[]): Promise<ReviewerRow[]> {
	if (artifactIds.length === 0) return [];
	const { data } = await supabase
		.from('section_reviewers')
		.select('*, artifact:artifacts(id, title)')
		.in('artifact_id', artifactIds)
		.order('created_at', { ascending: false });
	return (data ?? []) as ReviewerRow[];
}

async function loadAuditEntries(supabase: SupabaseClient, projectId: string) {
	const { data } = await supabase
		.from('audit_log')
		.select('*')
		.eq('project_id', projectId)
		.order('created_at', { ascending: false })
		.limit(5);
	return data ?? [];
}

function calculateProjectMetrics(artifacts: ArtifactWithDocType[]) {
	const totalSections = artifacts.length;
	const approvedSections = artifacts.filter((a) => a.status === 'approved').length;
	const progressPercentage = totalSections > 0
		? Math.round((approvedSections / totalSections) * 100)
		: 0;
	return { totalSections, approvedSections, progressPercentage };
}

function buildSectionsInReview(artifacts: ArtifactWithDocType[], reviewers: ReviewerRow[]) {
	return artifacts
		.filter((a) => a.status === 'review')
		.map((a) => {
			const reviewer = reviewers.find((r) => r.artifact_id === a.id);
			return {
				id: a.id,
				title: a.title,
				reviewerName: reviewer?.name ?? '',
				reviewerEmail: reviewer?.email ?? '',
				reviewStatus: reviewer?.review_status ?? 'pending',
				waitingSince: a.updated_at
			};
		});
}

function groupByDocumentType(artifacts: ArtifactWithDocType[]) {
	const groups: Record<string, {
		docType: { id: string; name: string; slug: string };
		items: ArtifactWithDocType[];
		total: number;
		approved: number;
		progress: number;
	}> = {};

	for (const artifact of artifacts) {
		const docType = artifact.document_type;
		const key = docType?.id ?? 'unknown';
		if (!groups[key]) {
			groups[key] = {
				docType: docType ?? { id: 'unknown', name: 'Overig', slug: 'overig' },
				items: [], total: 0, approved: 0, progress: 0
			};
		}
		groups[key].items.push(artifact);
		groups[key].total++;
		if (artifact.status === 'approved') groups[key].approved++;
		groups[key].progress = Math.round((groups[key].approved / groups[key].total) * 100);
	}
	return Object.values(groups);
}

async function loadLeidraadDocTypeId(supabase: SupabaseClient): Promise<string | null> {
	const { data } = await supabase
		.from('document_types')
		.select('id')
		.eq('slug', 'aanbestedingsleidraad')
		.maybeSingle();
	return data?.id ?? null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const [artifacts, phaseActivities, profileData, auditEntries, leidraadDocTypeId] = await Promise.all([
		loadArtifacts(supabase, params.id),
		loadPhaseActivities(supabase, params.id),
		loadProjectProfile(supabase, params.id),
		loadAuditEntries(supabase, params.id),
		loadLeidraadDocTypeId(supabase)
	]);

	const reviewers = await loadReviewers(supabase, artifacts.map((a) => a.id));

	return {
		artifacts,
		phaseActivities,
		profileSummary: profileData
			? {
				id: profileData.id,
				contracting_authority: profileData.contracting_authority,
				project_goal: profileData.project_goal,
				planning_generated_at: profileData.planning_generated_at ?? null
			}
			: null,
		auditEntries,
		projectMetrics: calculateProjectMetrics(artifacts),
		sectionsInReview: buildSectionsInReview(artifacts, reviewers),
		documentBlocks: groupByDocumentType(artifacts),
		leidraadDocTypeId
	};
};
