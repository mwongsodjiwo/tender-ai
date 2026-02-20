// Zod validation schemas for document roles (v2 Fase 19 + Fase 30)

import { z } from 'zod';
import { DOCUMENT_ROLE_KEYS } from '$types';

export const createDocumentRoleSchema = z.object({
	role_key: z.enum(DOCUMENT_ROLE_KEYS, {
		errorMap: () => ({ message: 'Ongeldige rolsleutel' })
	}),
	role_label: z.string().min(1, 'Rollabel is verplicht').max(100),
	project_member_id: z.string().uuid('Ongeldig lid-ID').optional(),
	person_name: z.string().max(200).optional(),
	person_email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
	person_phone: z.string().max(30).optional(),
	person_function: z.string().max(200).optional()
});

export const updateDocumentRoleSchema = z.object({
	project_member_id: z.string().uuid('Ongeldig lid-ID').nullable().optional(),
	person_name: z.string().max(200).optional(),
	person_email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
	person_phone: z.string().max(30).optional(),
	person_function: z.string().max(200).optional()
});
