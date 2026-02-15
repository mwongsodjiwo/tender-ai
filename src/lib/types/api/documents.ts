// Document API types

import type { Artifact, Document, DocumentType, TenderNedItem } from '../database.js';
import type { DocumentCategory, ProcedureType } from '../enums.js';

export interface AssembleDocumentRequest {
	document_type_id: string;
}

export interface AssembledDocument {
	document_type: DocumentType;
	artifacts: Artifact[];
	assembled_content: string;
}

export type ExportFormat = 'docx' | 'pdf';

export interface ExportRequest {
	document_type_id: string;
	format: ExportFormat;
}

export interface UploadDocumentRequest {
	organization_id: string;
	project_id?: string;
	category: DocumentCategory;
	name?: string;
}

export type DocumentResponse = Document;
export type DocumentListResponse = Document[];

export interface DeleteDocumentRequest {
	document_id: string;
}

export interface ContextSearchRequest {
	query: string;
	project_id?: string;
	organization_id?: string;
	limit?: number;
}

export interface ContextSearchResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
}

export interface EmbeddingStatusResponse {
	document_id: string;
	total_chunks: number;
	embedded_chunks: number;
	status: 'pending' | 'processing' | 'complete' | 'error';
}

export interface TenderNedSearchRequest {
	query: string;
	procedure_type?: ProcedureType;
	cpv_code?: string;
	limit?: number;
	offset?: number;
}

export interface TenderNedSearchResponse {
	items: TenderNedItem[];
	total: number;
}
