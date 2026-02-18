// Database row types for suppliers CRM (v2 Fase 8)

import type {
	DataClassification,
	ArchiveStatus,
	SupplierProjectStatus,
	SupplierProjectRole
} from '../enums.js';

export interface Supplier {
	id: string;
	organization_id: string;
	kvk_nummer: string | null;
	company_name: string;
	trade_name: string | null;
	legal_form: string | null;
	street: string | null;
	postal_code: string | null;
	city: string | null;
	sbi_codes: string[];
	website: string | null;
	tags: string[];
	rating: number | null;
	notes: string | null;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface SupplierContact {
	id: string;
	supplier_id: string;
	name: string;
	email: string | null;
	phone: string | null;
	function_title: string | null;
	is_primary: boolean;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ProjectSupplier {
	id: string;
	project_id: string;
	supplier_id: string;
	status: SupplierProjectStatus;
	role: SupplierProjectRole;
	invitation_sent_at: string | null;
	submission_received_at: string | null;
	submission_complete: boolean | null;
	offer_amount: number | null;
	signer_name: string | null;
	signer_title: string | null;
	metadata: Record<string, unknown>;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_at: string;
	updated_at: string;
}
