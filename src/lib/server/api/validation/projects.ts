import { z } from 'zod';
import { PROCEDURE_TYPES, PROJECT_STATUSES, PROJECT_ROLES } from '$types';

// =============================================================================
// CHAT
// =============================================================================

export const chatMessageSchema = z.object({
	conversation_id: z.string().uuid('Ongeldig gesprek-ID'),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});

// =============================================================================
// PROJECTS
// =============================================================================

export const createProjectSchema = z.object({
	organization_id: z.string().uuid('Ongeldig organisatie-ID'),
	name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten').max(200),
	description: z.string().max(2000).optional(),
	procedure_type: z.enum(PROCEDURE_TYPES).optional(),
	estimated_value: z.number().positive('Waarde moet positief zijn').optional(),
	publication_date: z.string().optional(),
	deadline_date: z.string().optional()
});

export const updateProjectSchema = z.object({
	name: z.string().min(2).max(200).optional(),
	description: z.string().max(2000).optional(),
	status: z.enum(PROJECT_STATUSES).optional(),
	procedure_type: z.enum(PROCEDURE_TYPES).optional(),
	estimated_value: z.number().positive().optional(),
	publication_date: z.string().optional(),
	deadline_date: z.string().optional(),
	briefing_data: z.record(z.unknown()).optional()
});

// =============================================================================
// PROJECT MEMBERS
// =============================================================================

export const addProjectMemberSchema = z.object({
	profile_id: z.string().uuid('Ongeldig profiel-ID'),
	roles: z.array(z.enum(PROJECT_ROLES)).min(1, 'Minimaal één rol vereist')
});

// =============================================================================
// PROJECT PROFILE — Sprint R2 (Projectprofiel)
// =============================================================================

export const createProjectProfileSchema = z.object({
	contracting_authority: z.string().max(500).optional().default(''),
	department: z.string().max(300).optional().default(''),
	contact_name: z.string().max(200).optional().default(''),
	contact_email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')).default(''),
	contact_phone: z.string().max(20).optional().default(''),
	project_goal: z.string().max(5000).optional().default(''),
	scope_description: z.string().max(10000).optional().default(''),
	estimated_value: z.number().positive('Waarde moet positief zijn').optional(),
	currency: z.string().max(3).optional().default('EUR'),
	cpv_codes: z.array(z.string().max(20)).optional().default([]),
	nuts_codes: z.array(z.string().max(20)).optional().default([]),
	timeline_start: z.string().optional(),
	timeline_end: z.string().optional()
});

export const updateProjectProfileSchema = z.object({
	contracting_authority: z.string().max(500).optional(),
	department: z.string().max(300).optional(),
	contact_name: z.string().max(200).optional(),
	contact_email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
	contact_phone: z.string().max(20).optional(),
	project_goal: z.string().max(5000).optional(),
	scope_description: z.string().max(10000).optional(),
	estimated_value: z.number().positive('Waarde moet positief zijn').optional(),
	currency: z.string().max(3).optional(),
	cpv_codes: z.array(z.string().max(20)).optional(),
	nuts_codes: z.array(z.string().max(20)).optional(),
	timeline_start: z.string().optional(),
	timeline_end: z.string().optional()
});

// =============================================================================
// CONFIRM PROJECT PROFILE — Sprint R4 (Projectprofiel bevestigen)
// =============================================================================

export const confirmProjectProfileSchema = z.object({
	confirmed: z.literal(true, {
		errorMap: () => ({ message: 'Bevestiging moet true zijn' })
	})
});
