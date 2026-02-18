// Database row types — exactly matching Supabase schema

import type {
	OrganizationRole,
	OrganizationType,
	ContractingAuthorityType,
	ProjectStatus,
	ProjectPhase,
	ProjectRole,
	ArtifactStatus,
	MessageRole,
	ProcedureType,
	ScoringMethodology,
	ContractType,
	GeneralConditionsType,
	DataClassification,
	ArchiveStatus
} from '../enums.js';

// =============================================================================
// BASE TYPES
// =============================================================================

export interface Organization {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	logo_url: string | null;
	parent_organization_id: string | null;
	organization_type: OrganizationType;
	aanbestedende_dienst_type: ContractingAuthorityType | null;
	kvk_nummer: string | null;
	handelsnaam: string | null;
	rechtsvorm: string | null;
	straat: string | null;
	postcode: string | null;
	plaats: string | null;
	sbi_codes: string[];
	nuts_codes: string[];
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface Profile {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	avatar_url: string | null;
	job_title: string | null;
	phone: string | null;
	is_superadmin: boolean;
	created_at: string;
	updated_at: string;
}

export interface OrganizationMember {
	id: string;
	organization_id: string;
	profile_id: string;
	role: OrganizationRole;
	source_organization_id: string | null;
	created_at: string;
	updated_at: string;
}

export interface Project {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	status: ProjectStatus;
	current_phase: ProjectPhase;
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	currency: string;
	publication_date: string | null;
	deadline_date: string | null;
	briefing_data: Record<string, unknown>;
	scoring_methodology: ScoringMethodology | null;
	contract_type: ContractType | null;
	general_conditions: GeneralConditionsType | null;
	profile_confirmed: boolean;
	profile_confirmed_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface ProjectMember {
	id: string;
	project_id: string;
	profile_id: string;
	created_at: string;
	updated_at: string;
}

export interface ProjectMemberRole {
	id: string;
	project_member_id: string;
	role: ProjectRole;
	created_at: string;
}

export interface DocumentType {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	template_structure: TemplateSection[];
	applicable_procedures: ProcedureType[];
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface TemplateSection {
	key: string;
	title: string;
	description: string;
}

export interface Artifact {
	id: string;
	project_id: string;
	document_type_id: string;
	section_key: string;
	title: string;
	content: string;
	status: ArtifactStatus;
	version: number;
	parent_artifact_id: string | null;
	sort_order: number;
	metadata: Record<string, unknown>;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface Conversation {
	id: string;
	project_id: string;
	artifact_id: string | null;
	title: string | null;
	context_type: string;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_by: string;
	created_at: string;
	updated_at: string;
}

export interface Message {
	id: string;
	conversation_id: string;
	role: MessageRole;
	content: string;
	metadata: Record<string, unknown>;
	token_count: number | null;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_by: string | null;
	created_at: string;
}
