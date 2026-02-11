// Gathers all context needed for AI planning generation

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectProfile, ProcedureType } from '$types';
import { getLegalMinimums, type LegalMinimums } from './legal-constraints.js';

export interface SimilarTender {
	title: string;
	procedure_type: string;
	estimated_value: number | null;
	publication_date: string | null;
	deadline_date: string | null;
	duration_days: number;
}

export interface PlanningContext {
	project_profile: ProjectProfile;
	procedure_type: ProcedureType;
	estimated_value: number | null;
	scope_description: string;
	legal_minimums: LegalMinimums;
	similar_tenders: SimilarTender[];
	team_size: number;
	team_roles: string[];
}

export async function gatherPlanningContext(
	supabase: SupabaseClient,
	projectId: string
): Promise<PlanningContext> {
	const [profileResult, projectResult, membersResult, similarResult] = await Promise.all([
		getProjectProfile(supabase, projectId),
		getProject(supabase, projectId),
		getProjectMembers(supabase, projectId),
		findSimilarTenders(supabase, projectId)
	]);

	const procedureType = projectResult.procedure_type ?? 'open';

	return {
		project_profile: profileResult,
		procedure_type: procedureType,
		estimated_value: projectResult.estimated_value,
		scope_description: profileResult.scope_description || projectResult.description || '',
		legal_minimums: getLegalMinimums(procedureType),
		similar_tenders: similarResult,
		team_size: membersResult.count,
		team_roles: membersResult.roles
	};
}

async function getProjectProfile(
	supabase: SupabaseClient,
	projectId: string
): Promise<ProjectProfile> {
	const { data, error } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.maybeSingle();

	if (error) {
		throw new Error(`Fout bij ophalen projectprofiel: ${error.message}`);
	}

	if (!data) {
		throw new Error('Projectprofiel niet gevonden. Vul eerst het projectprofiel in.');
	}

	return data as ProjectProfile;
}

async function getProject(
	supabase: SupabaseClient,
	projectId: string
): Promise<{
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	description: string | null;
	organization_id: string;
}> {
	const { data, error } = await supabase
		.from('projects')
		.select('procedure_type, estimated_value, description, organization_id')
		.eq('id', projectId)
		.is('deleted_at', null)
		.single();

	if (error || !data) {
		throw new Error('Project niet gevonden.');
	}

	return data;
}

async function getProjectMembers(
	supabase: SupabaseClient,
	projectId: string
): Promise<{ count: number; roles: string[] }> {
	const { data, error } = await supabase
		.from('project_members')
		.select('id, project_member_roles(role)')
		.eq('project_id', projectId);

	if (error) {
		return { count: 0, roles: [] };
	}

	const members = data ?? [];
	const allRoles = new Set<string>();

	for (const member of members) {
		const roles = (member as Record<string, unknown>).project_member_roles;
		if (Array.isArray(roles)) {
			for (const r of roles) {
				if (typeof r === 'object' && r !== null && 'role' in r) {
					allRoles.add(r.role as string);
				}
			}
		}
	}

	return {
		count: members.length,
		roles: [...allRoles]
	};
}

async function findSimilarTenders(
	supabase: SupabaseClient,
	projectId: string
): Promise<SimilarTender[]> {
	// Get project CPV codes for matching
	const { data: profile } = await supabase
		.from('project_profiles')
		.select('cpv_codes')
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.maybeSingle();

	const cpvCodes: string[] = profile?.cpv_codes ?? [];

	// Search knowledge base for similar tenders
	let query = supabase
		.from('knowledge_base_tenders')
		.select('title, procedure_type, estimated_value, publication_date, deadline_date')
		.not('publication_date', 'is', null)
		.not('deadline_date', 'is', null)
		.order('publication_date', { ascending: false })
		.limit(10);

	// Filter by CPV codes if available
	if (cpvCodes.length > 0) {
		query = query.overlaps('cpv_codes', cpvCodes);
	}

	const { data: tenders } = await query;

	if (!tenders || tenders.length === 0) {
		return [];
	}

	return tenders
		.filter((t) => t.publication_date && t.deadline_date)
		.map((t) => {
			const pubDate = new Date(t.publication_date!);
			const deadDate = new Date(t.deadline_date!);
			const durationDays = Math.ceil(
				(deadDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			return {
				title: t.title,
				procedure_type: t.procedure_type ?? 'onbekend',
				estimated_value: t.estimated_value,
				publication_date: t.publication_date,
				deadline_date: t.deadline_date,
				duration_days: Math.max(durationDays, 0)
			};
		})
		.slice(0, 5);
}
