// Project overview page — load artifacts, activities, metrics, and recent activity

import type { PageServerLoad } from './$types';
import type { PhaseActivity } from '$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// Load artifacts with document types
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*, document_type:document_types(id, name, slug)')
		.eq('project_id', params.id)
		.order('sort_order');

	const allArtifacts = artifacts ?? [];
	const artifactIds = allArtifacts.map((a) => a.id);

	// Load phase activities from database
	const { data: phaseActivitiesData } = await supabase
		.from('phase_activities')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('sort_order');

	const phaseActivities: PhaseActivity[] = (phaseActivitiesData ?? []) as PhaseActivity[];

	// Load project profile for confirmation status
	const { data: profileData } = await supabase
		.from('project_profiles')
		.select('id, contracting_authority, project_goal')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	// Load reviewers for sections in review
	let reviewers: unknown[] = [];
	if (artifactIds.length > 0) {
		const { data: reviewerData } = await supabase
			.from('section_reviewers')
			.select('*, artifact:artifacts(id, title)')
			.in('artifact_id', artifactIds)
			.order('created_at', { ascending: false });
		reviewers = reviewerData ?? [];
	}

	// Load recent audit log entries (preview — 5 most recent)
	const { data: auditEntries } = await supabase
		.from('audit_log')
		.select('*')
		.eq('project_id', params.id)
		.order('created_at', { ascending: false })
		.limit(5);

	// Calculate project metrics
	const totalSections = allArtifacts.length;
	const approvedSections = allArtifacts.filter((a) => a.status === 'approved').length;
	const progressPercentage =
		totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0;

	// Sections currently in review
	const sectionsInReview = allArtifacts
		.filter((a) => a.status === 'review')
		.map((a) => {
			const reviewer = (
				reviewers as {
					artifact_id: string;
					name: string;
					email: string;
					review_status: string;
				}[]
			).find((r) => r.artifact_id === a.id);
			return {
				id: a.id,
				title: a.title,
				reviewerName: reviewer?.name ?? '',
				reviewerEmail: reviewer?.email ?? '',
				reviewStatus: reviewer?.review_status ?? 'pending',
				waitingSince: a.updated_at
			};
		});

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

	// Load leidraad document type ID for direct link
	const { data: leidraadDocType } = await supabase
		.from('document_types')
		.select('id')
		.eq('slug', 'aanbestedingsleidraad')
		.maybeSingle();

	return {
		artifacts: allArtifacts,
		phaseActivities,
		profileSummary: profileData
			? { id: profileData.id, contracting_authority: profileData.contracting_authority, project_goal: profileData.project_goal }
			: null,
		auditEntries: auditEntries ?? [],
		projectMetrics: {
			totalSections,
			approvedSections,
			progressPercentage
		},
		sectionsInReview,
		documentBlocks: Object.values(documentBlocks),
		leidraadDocTypeId: leidraadDocType?.id ?? null
	};
};
