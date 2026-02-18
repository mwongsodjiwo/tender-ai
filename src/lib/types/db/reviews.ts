import type {
	ReviewStatus,
	AuditAction,
	DataClassification,
	ArchiveStatus
} from '../enums.js';

export interface SectionReviewer {
	id: string;
	artifact_id: string;
	email: string;
	name: string;
	token: string;
	review_status: ReviewStatus;
	feedback: string | null;
	reviewed_at: string | null;
	expires_at: string;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_at: string;
	updated_at: string;
}

export interface AuditLogEntry {
	id: string;
	organization_id: string | null;
	project_id: string | null;
	actor_id: string | null;
	actor_email: string | null;
	action: AuditAction;
	entity_type: string;
	entity_id: string | null;
	changes: Record<string, unknown>;
	ip_address: string | null;
	user_agent: string | null;
	created_at: string;
}

export interface ArtifactVersion {
	id: string;
	artifact_id: string;
	version: number;
	title: string;
	content: string;
	created_by: string | null;
	created_at: string;
}
