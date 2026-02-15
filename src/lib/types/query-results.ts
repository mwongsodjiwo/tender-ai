// Types for Supabase joined queries — replaces all unsafe casts

import type { Milestone, PhaseActivity, Artifact } from './database.js';

/** Milestone with joined project name (via projects!inner) */
export interface MilestoneWithProjectName extends Milestone {
	projects: { name: string };
}

/** Phase activity with joined project name (via projects!inner) */
export interface ActivityWithProjectName extends PhaseActivity {
	projects: { name: string };
}

/** Phase activity with joined project and assigned profile */
export interface ActivityWithProjectAndProfile extends PhaseActivity {
	projects: { name: string };
	profiles: { full_name: string } | null;
}

/** Document chunk with joined document metadata (fallback text search) */
export interface DocumentChunkWithDocument {
	id: string;
	document_id: string;
	content: string;
	documents: { name: string; deleted_at: string | null } | null;
}

/** TenderNed chunk with joined item title (fallback text search) */
export interface TenderNedChunkWithItem {
	id: string;
	tenderned_item_id: string;
	content: string;
	tenderned_items: { title: string } | null;
}

/** Artifact with joined document type */
export interface ArtifactWithDocType extends Artifact {
	document_type: { id: string; name: string; slug: string } | null;
}

/** Organization member with joined profile data */
export interface OrgMemberWithProfile {
	profile_id: string;
	profiles: {
		id: string;
		first_name: string;
		last_name: string;
		avatar_url: string | null;
	};
}

/** Project member role with joined project member */
export interface RoleWithProjectMember {
	project_members: { profile_id: string };
	role: string;
}

/** Milestone with project and members (for deadline notifications) */
export interface MilestoneWithProjectAndMembers {
	id: string;
	title: string;
	target_date: string;
	is_critical: boolean;
	project_id: string;
	projects: { name: string; organization_id: string };
	members: { profile_id: string }[];
}
