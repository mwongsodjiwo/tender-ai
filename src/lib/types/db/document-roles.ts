// Database row types for project document roles (v2 Fase 19)

import type {
	DataClassification,
	ArchiveStatus,
	DocumentRoleKey
} from '../enums.js';

export interface ProjectDocumentRole {
	id: string;
	project_id: string;
	role_key: DocumentRoleKey;
	role_label: string;
	project_member_id: string | null;
	person_name: string | null;
	person_email: string | null;
	person_phone: string | null;
	person_function: string | null;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_at: string;
	updated_at: string;
}
