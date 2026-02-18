// Supplier API request/response types (v2 Fase 8)

import type { Supplier, SupplierContact, ProjectSupplier } from '../db/suppliers.js';
import type { SupplierProjectStatus, SupplierProjectRole } from '../enums.js';

export interface CreateSupplierRequest {
	organization_id: string;
	kvk_nummer?: string;
	company_name: string;
	trade_name?: string;
	legal_form?: string;
	street?: string;
	postal_code?: string;
	city?: string;
	sbi_codes?: string[];
	website?: string;
	tags?: string[];
	rating?: number;
	notes?: string;
}

export interface UpdateSupplierRequest {
	company_name?: string;
	trade_name?: string;
	legal_form?: string;
	street?: string;
	postal_code?: string;
	city?: string;
	sbi_codes?: string[];
	website?: string;
	tags?: string[];
	rating?: number;
	notes?: string;
}

export interface CreateSupplierContactRequest {
	name: string;
	email?: string;
	phone?: string;
	function_title?: string;
	is_primary?: boolean;
}

export interface LinkProjectSupplierRequest {
	supplier_id: string;
	status?: SupplierProjectStatus;
	role?: SupplierProjectRole;
}

export interface UpdateProjectSupplierRequest {
	status?: SupplierProjectStatus;
	role?: SupplierProjectRole;
	invitation_sent_at?: string;
	submission_received_at?: string;
	submission_complete?: boolean;
	offer_amount?: number;
	signer_name?: string;
	signer_title?: string;
}

export type SupplierResponse = Supplier;
export type SupplierListResponse = Supplier[];

export interface SupplierDetailResponse extends Supplier {
	contacts: SupplierContact[];
}

export type SupplierContactResponse = SupplierContact;
export type ProjectSupplierResponse = ProjectSupplier;
export type ProjectSupplierListResponse = ProjectSupplier[];
