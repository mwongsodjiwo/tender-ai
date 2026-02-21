// Project API types

import type { Profile, Project, ProjectMember, ProjectMemberRole, ProjectProfile } from '../database.js';
import type { ProcedureType, ProjectRole, ProjectPhase, ActivityStatus } from '../enums.js';

export interface CreateProjectRequest {
	organization_id: string;
	name: string;
	description?: string;
	procedure_type?: ProcedureType;
	estimated_value?: number;
	publication_date?: string;
	deadline_date?: string;
}

export interface UpdateProjectRequest {
	name?: string;
	description?: string;
	status?: 'draft' | 'briefing' | 'generating' | 'review' | 'approved' | 'published' | 'archived';
	procedure_type?: ProcedureType;
	estimated_value?: number;
	publication_date?: string;
	deadline_date?: string;
	briefing_data?: Record<string, unknown>;
}

export type ProjectResponse = Project;
export type ProjectListResponse = Project[];

export interface AddProjectMemberRequest {
	profile_id: string;
	roles: ProjectRole[];
}

export interface ProjectMemberWithRoles extends ProjectMember {
	profile: Profile;
	roles: ProjectMemberRole[];
}

export interface UpdateProjectMemberRolesRequest {
	roles: ProjectRole[];
}

export interface RemoveProjectMemberRequest {
	project_member_id: string;
}

export interface CreateProjectProfileRequest {
	contracting_authority?: string;
	department?: string;
	contact_name?: string;
	contact_email?: string;
	contact_phone?: string;
	project_goal?: string;
	scope_description?: string;
	estimated_value?: number;
	currency?: string;
	cpv_codes?: string[];
	nuts_codes?: string[];
}

export interface UpdateProjectProfileRequest {
	contracting_authority?: string;
	department?: string;
	contact_name?: string;
	contact_email?: string;
	contact_phone?: string;
	project_goal?: string;
	scope_description?: string;
	estimated_value?: number;
	currency?: string;
	cpv_codes?: string[];
	nuts_codes?: string[];
}

export type ProjectProfileResponse = ProjectProfile;

export interface ConfirmProjectProfileResponse {
	profile_confirmed: boolean;
	profile_confirmed_at: string;
}

export interface ProjectOverviewMetrics {
	total_sections: number;
	approved_sections: number;
	progress_percentage: number;
}

export interface ProjectOverviewDocumentBlock {
	doc_type_id: string;
	doc_type_name: string;
	doc_type_slug: string;
	total: number;
	approved: number;
	progress: number;
}

export interface ProjectOverviewActivity {
	id: string;
	phase: ProjectPhase;
	title: string;
	status: ActivityStatus;
	href: string | null;
}
