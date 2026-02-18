// Zod validation schemas for suppliers CRM (v2 Fase 8)

import { z } from 'zod';
import { SUPPLIER_PROJECT_STATUSES, SUPPLIER_PROJECT_ROLES } from '$types';

const kvkNummerPattern = /^\d{8}$/;

export const createSupplierSchema = z.object({
	organization_id: z.string().uuid('Ongeldige organisatie-ID'),
	kvk_nummer: z.string().regex(kvkNummerPattern, 'KVK-nummer moet exact 8 cijfers zijn').optional(),
	company_name: z.string().min(1, 'Bedrijfsnaam is verplicht').max(300),
	trade_name: z.string().max(300).optional(),
	legal_form: z.string().max(100).optional(),
	street: z.string().max(200).optional(),
	postal_code: z.string().max(7).optional(),
	city: z.string().max(100).optional(),
	sbi_codes: z.array(z.string().max(10)).max(20).optional(),
	website: z.string().url('Ongeldig URL-formaat').max(500).optional(),
	tags: z.array(z.string().max(50)).max(20).optional(),
	rating: z.number().int().min(1).max(5).optional(),
	notes: z.string().max(5000).optional()
});

export const updateSupplierSchema = z.object({
	company_name: z.string().min(1, 'Bedrijfsnaam is verplicht').max(300).optional(),
	trade_name: z.string().max(300).optional(),
	legal_form: z.string().max(100).optional(),
	street: z.string().max(200).optional(),
	postal_code: z.string().max(7).optional(),
	city: z.string().max(100).optional(),
	sbi_codes: z.array(z.string().max(10)).max(20).optional(),
	website: z.string().url('Ongeldig URL-formaat').max(500).optional(),
	tags: z.array(z.string().max(50)).max(20).optional(),
	rating: z.number().int().min(1).max(5).optional(),
	notes: z.string().max(5000).optional()
});

export const createSupplierContactSchema = z.object({
	name: z.string().min(1, 'Naam is verplicht').max(200),
	email: z.string().email('Ongeldig e-mailadres').max(320).optional(),
	phone: z.string().max(30).optional(),
	function_title: z.string().max(200).optional(),
	is_primary: z.boolean().optional()
});

export const linkProjectSupplierSchema = z.object({
	supplier_id: z.string().uuid('Ongeldige leverancier-ID'),
	status: z.enum(SUPPLIER_PROJECT_STATUSES).optional(),
	role: z.enum(SUPPLIER_PROJECT_ROLES).optional()
});

export const updateProjectSupplierSchema = z.object({
	status: z.enum(SUPPLIER_PROJECT_STATUSES).optional(),
	role: z.enum(SUPPLIER_PROJECT_ROLES).optional(),
	invitation_sent_at: z.string().datetime().optional(),
	submission_received_at: z.string().datetime().optional(),
	submission_complete: z.boolean().optional(),
	offer_amount: z.number().min(0).max(99999999999.99).optional(),
	signer_name: z.string().max(200).optional(),
	signer_title: z.string().max(200).optional()
});

export const supplierSearchQuerySchema = z.object({
	search: z.string().max(300).optional(),
	tag: z.string().max(50).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0)
});
