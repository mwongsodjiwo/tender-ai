import type {
	DocumentCategory,
	ProcedureType,
	DataClassification,
	ArchiveStatus
} from '../enums.js';

export interface Document {
	id: string;
	organization_id: string;
	project_id: string | null;
	name: string;
	file_path: string;
	file_size: number;
	mime_type: string;
	category: DocumentCategory;
	content_text: string | null;
	metadata: Record<string, unknown>;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	uploaded_by: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface TenderNedItem {
	id: string;
	external_id: string;
	title: string;
	description: string | null;
	contracting_authority: string | null;
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	deadline_date: string | null;
	cpv_codes: string[];
	status: string | null;
	source_url: string | null;
	raw_data: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

// =============================================================================
// DOCUMENT CHUNKS — Sprint 4 (for RAG pipeline)
// =============================================================================

export interface DocumentChunk {
	id: string;
	document_id: string;
	chunk_index: number;
	content: string;
	token_count: number | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface TenderNedChunk {
	id: string;
	tenderned_item_id: string;
	chunk_index: number;
	content: string;
	token_count: number | null;
	metadata: Record<string, unknown>;
	created_at: string;
}
