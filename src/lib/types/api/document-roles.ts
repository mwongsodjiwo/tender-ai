// API request/response types for document roles (v2 Fase 19 + Fase 30)

import type { DocumentRoleKey } from '../enums.js';

export interface CreateDocumentRoleRequest {
	role_key: DocumentRoleKey;
	role_label: string;
	project_member_id?: string;
	person_name?: string;
	person_email?: string;
	person_phone?: string;
	person_function?: string;
}

export interface UpdateDocumentRoleRequest {
	project_member_id?: string | null;
	person_name?: string;
	person_email?: string;
	person_phone?: string;
	person_function?: string;
}

export interface DocumentRoleResponse {
	id: string;
	project_id: string;
	role_key: DocumentRoleKey;
	role_label: string;
	project_member_id: string | null;
	person_name: string | null;
	person_email: string | null;
	person_phone: string | null;
	person_function: string | null;
	created_at: string;
	updated_at: string;
}
